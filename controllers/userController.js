const catchAsync=require('./../utils.js/catchAsync');
const User=require('./../models/userModel');
const AppError=require('./../utils.js/appError');
const factory=require('./handlerFactory');
const multer=require('multer');
const sharp=require('sharp');


// const multerStorage= multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,'public/img/users');
//     },
//     filename:(req,file,cb)=>{
//         //user-28937983793-878379398.jpeg
//         const ext=file.mimetype.split('/')[1];
//         cb(null,`user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// })

const multerStorage=multer.memoryStorage(); // image will be stored first in buffer in memory

// To check the uploaded file is img only
const multerFilter=(req,file,cb)=>{
    if(file.mimetype.startsWith('image')){//bcz all the image have image/jpeg or image/jpg in mimetype so if there is image we can know its image file
        cb(null,true);
    }
    else{
        cb(new AppError('Not an image! Please upload only images',400),false);
    }
}


const upload=multer({
        storage:multerStorage,
        fileFilter:multerFilter
    });

exports.uploadUserPhoto = upload.single('photo');

// For Resizing the image before saving the image
exports.resizeUserPhoto=catchAsync(async(req,res,next)=>{
    if(!req.file) return next();

    req.file.filename=`user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500,500)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/users/${req.file.filename}`); //here image will be saved in filestorage

        next();
});

const filterObj=(obj, ...allowedFields)=>{
    const newObj={};
    Object.keys(obj).forEach(el=>{
        if(allowedFields.includes(el))
            newObj[el]=obj[el];
    })
    return newObj;
}


exports.createUser= (req,res)=>{
    res.status(404).json({
        status:"Pending",
        message:"The route will not be defined. Please use the /Signup"
    })
}

exports.getUser= factory.getOne(User);

//Do not update password with this
exports.updateUser= factory.updateOne(User);
exports.deleteUser= factory.deleteOne(User);
exports.getAllUsers=factory.getAll(User);

exports.updateMe=catchAsync(async(req,res,next)=>{

    console.log(req.file);
    console.log(req.body);
    

    // 1) Create password if user posts password
    if(req.body.password || req.body.passwordConfirm)
        return next(new AppError('This route is not for password updates. Please use for updateMyPassword',400));

    // 2) Update user document
    const filteredBody=filterObj(req.body,'name','email');
    if(req.file) filteredBody.photo=req.file.filename;

    const updatedUser=await User.findByIdAndUpdate(req.user.id ,filteredBody, {
        new:true,
        runValidators:true
    })

    res.status(200).json({
        status:'success',
        data:{
            user:updatedUser
        }
    })
});

exports.deleteMe = catchAsync(async(req,res,next)=>{
    await User.findByIdAndUpdate(req.user.id,{active:false});
    //req.user.id comes from token when logged in

    res.status(204).json({
        status:'success',
        data:null
    })
});

exports.getMe= (req,res,next)=>{
    req.params.id=req.user.id;
    next();
}