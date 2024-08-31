const express=require('express');
const router=express.Router({mergeParams:true});//merge params so that we can access the params of nested api ike tourid in review

const {getAllReviews,createReview,deleteReview,updateReview,setTourAndUserIds,getReview}=require('./../controllers/reviewController');
const {protect,restrictTo}=require('./../controllers/authController');

router.use(protect); //middleware runs sequentially

router.route('/').get(getAllReviews)
                 .post(protect,restrictTo('user'),setTourAndUserIds,createReview);
                 
router.route('/:id').delete(restrictTo('user','admin'),deleteReview)
                    .patch(restrictTo('user','admin'),updateReview)
                    .get(getReview);

module.exports=router;                 