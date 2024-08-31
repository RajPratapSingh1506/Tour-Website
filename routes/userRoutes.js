const express=require('express');



const router=express.Router();

const {getAllUsers,getUser,createUser,updateUser,deleteUser,updateMe,deleteMe,getMe,uploadUserPhoto,resizeUserPhoto}=require('./../controllers/userController');
const {signup,login, forgotPassword,resetPassword,updateMyPassword,protect,restrictTo,logout}=require('./../controllers/authController');

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/logout').get(logout);

router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword/:token').patch(resetPassword);

router.use(protect);//middleware runs in sequence so protect middleware will be applied to all the below rotes or we can provide protect to each route seperately 

router.route('/updateMyPassword').patch(updateMyPassword);
router.route('/updateMe').patch(uploadUserPhoto,resizeUserPhoto,updateMe);
router.route('/deleteMe').delete(deleteMe);
router.route('/getMe').get(getMe,getUser);//nice approach


router.use(restrictTo('admin'));

router.route('/')
    .get(getAllUsers)
    .post(createUser);

router.route('/:id')
    .get(getUser)
    .patch(updateUser)
    .delete(restrictTo('admin'),deleteUser);

module.exports=router;