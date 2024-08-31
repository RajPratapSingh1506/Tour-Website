const stripe=require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const catchAsync=require('./../utils.js/catchAsync');
const APIFeatures=require('./../utils.js/apifeatures');
const AppError=require('./../utils.js/appError');
const factory=require('./handlerFactory');
const Booking = require('./../models/bookingModel');

exports.getCheckOutSession=catchAsync(async(req,res,next)=>{
    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);


    // 2) Create checkout session
    const session= await stripe.checkout.sessions.create({
        payment_method_types:['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url:`${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email:req.user.email,
        client_reference_id:req.params.tourId,
        line_items:[ 
            {
            price_data:{
                currency:'usd',
                unit_amount: tour.price * 100,
                product_data:{
                    name:`${tour.name} Tour`,
                    description:tour.summary,
                    images:[`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`]
                },
            },
            quantity:1
        }],
        mode:'payment'
    });

    // 3) create session as response
    res.status(200).json({
        status:'success',
        session
    })
});

exports.createBookingCheckout = catchAsync(async(req,res,next)=>{
    // This is temporary cuz its unsecurre
    const {tour,user,price}=req.query;

    if(!tour && !user && !price) return next();

    await Booking.create({tour,user,price});
    res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);