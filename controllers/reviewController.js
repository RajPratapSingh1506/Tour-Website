const Review=require('./../models/reviewModel');
//const catchAsync=require('./../utils.js/catchAsync');
const factory=require('./handlerFactory');

exports.getAllReviews = factory.getAll(Review);
// catchAsync(async(req,res,next)=>{
//     let filter={};
//     if(req.params.tourId) filter={tour:req.params.tourId}
//     const reviews=await Review.find(filter);

//     res.status(200).json({
//         status:'success',
//         results:reviews.length,
//         data:{
//             reviews
//         }
//     });
// });

exports.setTourAndUserIds=(req,res,next)=>{
     //allow nested routes
     if(!req.body.tour) req.body.tour=req.params.tourId;
     if(!req.body.user) req.body.user=req.user.id;
     next();
}

exports.createReview= factory.createOne(Review);
// catchAsync(async(req,res,next)=>{
//     //allow nested routes
//     if(!req.body.tour) req.body.tour=req.params.tourId;
//     if(!req.body.user) req.body.user=req.user.id;


//     const newReview= await Review.create(req.body);

//     res.status(200).json({
//         status:'success',
//         data:{
//             newReview
//         }
//     });
// })

exports.deleteReview=factory.deleteOne(Review);
exports.updateReview=factory.updateOne(Review);
exports.getReview=factory.getOne(Review);