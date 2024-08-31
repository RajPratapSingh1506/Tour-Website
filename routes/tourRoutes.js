const express=require('express');
const router=express.Router();
const reviewRouter=require('./../routes/reviewRoutes')

const {getAllTours,createTour,getTour,updateTour,deleteTour,aliasTopTours,getTourStats,getMonthlyPlan,getToursWithin,getDistance,uploadTourImages,resizeTourImages}=require('./../controllers/tourController')
const {protect,restrictTo}=require('./../controllers/authController');
//router.param('id',checkID);

// Nested api
router.use('/:tourId/reviews',reviewRouter);

//using middleware to get the top 5 tours middleware prefills the query data
router.route('/top-5-tours').get(aliasTopTours,getAllTours);

router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(protect,restrictTo('admin','lead-guide','guide'),getMonthlyPlan);

router.route('/tours-within/:distance/centre/:latlng/unit/:unit').get(getToursWithin);
router.route('/distance/:latlng/unit/:unit').get(getDistance);

router.route('/')
    .get(getAllTours)
    .post(protect,restrictTo('admin','lead-guide'),createTour);
//middleware is placed before router function

router.route('/:id')
    .get(getTour)
    .patch(protect,restrictTo('admin','lead-guide'),uploadTourImages,resizeTourImages,updateTour)
    .delete(protect,restrictTo('admin','lead-guide'),deleteTour);

module.exports=router;