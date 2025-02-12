const Tour=require('./../models/tourModel');
const catchAsync=require('../utils.js/catchAsync');
const AppError=require('./../utils.js/appError');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');



exports.getOverview=catchAsync(async(req,res,next)=>{

    // 1)  Get Tour data from Collection
    const tours= await Tour.find();

    // 2) Build template
    // 3) Render that template using tour dat
    res.status(200).render('overview',{
        title:'All Tours',
        tours:tours
    }); 
});

exports.getTour=catchAsync(async(req,res,next)=>{

    // 1) Get the data for the requested tour(including guide and reviews)
    const tour= await Tour.findOne({slug: req.params.slug}).populate({
        path:'reviews',
        fields: 'review rating user'
    });

    if(!tour)
        return next (new AppError('No Tour with this name!!'));

    res.status(200).render('tour',{
        title:`${tour.name} Tour`,
        tour:tour
    }); 
});

exports.getLoginForm=catchAsync(async(req,res,next)=>{

    res.status(200).render('login',{
        title:'Login'
    });
})

exports.getAccount=(req,res)=>{
    res.status(200).render('account',{
        title:'My Account'
    });
}

exports.getSignUpForm=catchAsync(async(req,res,next)=>{
    res.status(200).render('signup',{
        title:'Sign Up'
    });
})

exports.getMyTours=catchAsync(async(req,res,next)=>{
    const bookings= await Booking.find({user:req.user.id});

    const tourIDs=bookings.map(el=>el.tour);
    const tours=await Tour.find({_id:{$in:tourIDs}});

    res.status(200).render('overview',{
        title:'My Tours',
        tours
    }); 

})

exports.updateUserData=catchAsync(async(req,res,next)=>{
    const updatedUser= await User.findByIdAndUpdate(req.user.id,{
        name:req.body.name,
        email:req.body.email
    },{
        new:true,
        runValidators:true
    });
    
    res.status(200).render('account',{
        title:'My Account',
        user:updatedUser
    })
})