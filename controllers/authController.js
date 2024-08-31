const {promisify}=require('util');
const User=require('./../models/userModel');
const catchAsync=require('./../utils.js/catchAsync');
const jwt=require('jsonwebtoken');
const AppError=require('./../utils.js/appError');
const { log } = require('console');
const Email=require('./../utils.js/email')
const crypto=require('crypto');

const signToken =(id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    });
}

const createSendToken=(user,statusCode,res)=>{
    const token=signToken(user._id);

    const cookieOptions={
      expires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN *24 * 60 * 60 * 1000),
      httpOnly:true
    };

    if(process.env.NODE_ENV === 'production') cookieOptions.secure=true;
    res.cookie('jwt',token,cookieOptions);
    user.password=undefined;
    res.status(statusCode).json({
        status:'success',
        token,
        data:{
            user:user
        }
    });
};

exports.signup=catchAsync(async(req,res,next)=>{
    const newUser = await User.create({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        passwordConfirm:req.body.passwordConfirm,
        // passwordChangedAt:req.body.passwordChangedAt,
        // role:req.body.role
    });
    //const url=`${req.protocol}://${req.get('host')}/me`;
    //console.log(url);
    
    //await new Email(newUser,url).sendWelcome();

    createSendToken(newUser, 201, res);
});

exports.login=catchAsync(async(req,res,next)=>{
    const {email,password}=req.body;
    //check if email and password is provided or not in body
    if(!email || !password)
    return next(new AppError('Please provide Email and Password',400));

    //check if user exists && password
    const user= await User.findOne({email}).select('+password');//here + is used to select field which is set as select:false in model
    //checking email password together doesnt give potential information that which thing is not correct

    console.log(user);
    

    if(!user || !await user.correctPassword(password,user.password))
    return next(new AppError('Incorrect Email or Password',401));

    createSendToken(user, 200, res);
    // const token=signToken(user._id);
    // res.status(200).json({
    //     status:'success',
    //     token
    // })
});

exports.logout=(req,res)=>{
  res.cookie('jwt','loggedOut',{
    expires:new Date(Date.now()),
    httpOnly:true
  });
  res.status(200).json({
    status:'success'
  })
};

exports.protect=catchAsync(async(req,res,next)=>{
    //1) Getting token and checking it's there
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
    {
        token=req.headers.authorization.split(' ')[1];
    }
    else if(req.cookies.jwt)
    {
      token =req.cookies.jwt;
    }
    //console.log(token);

    if(!token){
        return next(new AppError('You are not Logged in!! Please login in',401));
    }
    //2) Validate the token
    const decoded= await promisify(jwt.verify)(token,process.env.JWT_SECRET);
   // console.log(decoded);

    //3) checking if the user still exists
    const currentUser=await User.findById(decoded.id);
    if(!currentUser){
        return next(new AppError('The user belonging to token no longer exist',401));
    }
    //4) checking if user changed password
    if(currentUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User Recently changed Password. Please login again '))
    }
    req.user=currentUser;// so that authenticated user data can be read using req.user.id
    res.locals.user=currentUser; // bcz in /me route we are not checking logged in so we need data to use in account page 
    next();
});

//only for rendered pages not for error
exports.isLoggedIn=async(req,res,next)=>{

  if(req.cookies.jwt)
    {
      try{

        const decoded= await promisify(jwt.verify)(req.cookies.jwt,process.env.JWT_SECRET);
      // console.log(decoded);

        //3) checking if the user still exists
        const currentUser=await User.findById(decoded.id);
        if(!currentUser){
            return next();
        }
        //4) checking if user changed password
        if(currentUser.changedPasswordAfter(decoded.iat)){
            return next();
        }

        // There is a logged in user if we reach till here
        res.locals.user=currentUser;// res.locals will be available to every pug this USER is used in account page 
        return next();
      }
      catch(err){
          return next();
        }
      }
      next();
};

exports.restrictTo= (...roles)=>{
    return (req,res,next)=>{
        console.log(req.user.role);
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action',403));//403-forbidden
        }
        next();
    }
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError('There is no user with email address.', 404));
    }
  console.log(user);
    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    console.log(user);
  
    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
  
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
  
    try {
      
      await new Email(user,resetURL).sendPasswordReset();
  
      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
        console.log(err);
      return next(
        new AppError('There was an error sending the email. Try again later!'),
        500
      );
    }
  });


exports.resetPassword=catchAsync(async(req,res,next)=>{
    // 1) Get user based on the token
    const hashedToken=crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user=await User.findOne({
        passwordResetToken:hashedToken,
        passwordResetExpires:{ $gt: Date.now() }
    });
    // 2) If token not expired and there is user , set the new password
    if(!user)
    {
        return next(new AppError('Invalid token or token is expired!',400));
    }
    user.password=req.body.password;
    user.passwordConfirm=req.body.passwordConfirm;
    user.passwordResetToken=undefined;
    user.passwordResetExpires=undefined;
    await user.save();

    // 3) Update the ChangedpasswordAt property for the user
    // 4) Login the user and send JWT 
    createSendToken(user, 200, res);
    // const token=signToken(user._id);
    // res.status(200).json({
    //     status:'success',
    //     token,
    //     message:"Password Changed"
    // })
});

exports.updateMyPassword=catchAsync(async(req,res,next)=>{
    // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});