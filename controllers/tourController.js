const Tour = require('./../models/tourModel');
const catchAsync=require('./../utils.js/catchAsync');
const APIFeatures=require('./../utils.js/apifeatures');
const AppError=require('./../utils.js/appError');
const factory=require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

//const tours=JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

// upload.single('image') req.file
// upload.array('images', 5) req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
}); 


exports.aliasTopTours=(req,res,next)=>{
    req.query.limit='5';
    req.query.sort='price,-ratingsAverage';
    req.query.fields='name,price,ratingsAverage,summary,difficulty';
    next();
}

exports.getAllTours= factory.getAll(Tour);
// catchAsync(async(req,res,next)=>{

//     const features= new APIFeatures(Tour.find(),req.query)
//     .filter()
//     .sort()
//     .LimitFields()
//     .paginate();

//     const tours= await features.query;


//     res.status(200).json({
//     status:"Success",
//     results:tours.length,
//     data:{
//         tours
//     }
//    });
// });

exports.createTour= factory.createOne(Tour);
// catchAsync(async(req,res,next)=>{
//     //const newTour= new Tour({})
//     //newTour.save()   or   create
//         const newTour= await Tour.create(req.body);
//         res.status(201).json({
//             status:"success",
//             data:{
//                 tour:newTour
//             }
//         });
// });

exports.getTour= factory.getOne(Tour,{path:'reviews'});
// catchAsync(async(req,res,next)=>{
//     const tour=await Tour.findById(req.params.id).populate('reviews');
//     //findbyid is similar for Tour.findOne({_id:req.params.id})
//     if(!tour){
//         return next(new AppError('No tour found with that id',404));
//     }
//     res.status(200).json({
//         status:"Success",
//         data:{
//             tour
//         }
//     });
// });

 exports.deleteTour=factory.deleteOne(Tour);
// catchAsync(async(req,res,next)=>{
//       const tour=  await Tour.findByIdAndDelete(req.params.id);
//       if(!tour){
//         return next(new AppError('No tour found with that id',404));
//     }  
//         res.status(200).json({
//             status:"Success",
//             data:{               
//             }
//         });   
// });

exports.updateTour= factory.updateOne(Tour);
// catchAsync(async (req,res,next)=>{
//         const tour=await Tour.findByIdAndUpdate(req.params.id,req.body,{
//             new:true,
//             runValidators:true
//         });

//         if(!tour){
//             return next(new AppError('No tour found with that id',404));
//         }
       
//         res.status(200).json({
//             status:"Success",
//             data:{
//                 tour
//             }
//         })
// });

exports.getTourStats= catchAsync(async(req,res,next)=>{
        const stats=await Tour.aggregate([
            {
                $match:{   ratingsAverage: { $gte : 4.5}  }
            },
            {
                $group:{
                    _id: { $toUpper : '$difficulty'},
                    numTours:{$sum : 1},
                    numRatings:{$sum: '$ratingsQuantity'},
                    avgRating:{$avg:'$ratingsAverage'},
                    avgPrice:{$avg:'$price'},
                    minPrice:{$min:'$price'},
                    maxPrice:{$max:'$price'}
                }
            },
            {
                $sort:{avgPrice :1}//1 indicates ascending
            }
            // {
            //     $match:{
            //         numTours:{$gte:3}
            //     }
            // }
        ]);
        res.status(200).json({
            status:"Success",
            data:{
                stats
            }
        });
    });

exports.getMonthlyPlan = catchAsync(async(req,res,next)=>{
        const year=req.params.year * 1;
        const plan = await Tour.aggregate([
            {
                $unwind:'$startDates'
            },
            {
                $match:{
                    startDates:{
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${year+1}-01-01`)
                    }
                }
            },
            {
                $group:{
                    _id:{ $month:'$startDates'},
                    numTourStarts:{$sum:1},
                    tours:{$push:'$name'}
                }
             },{
                $addFields:{ month:'$_id'}
            },{
                $project:{_id:0}
            },{
                $sort:{numTourStarts:-1}
            },
            {
                $limit:12
            }
        ]);
        res.status(200).json({
            status:"Success",
            results:plan.length,
            data:{
                plan
            }
        });
});

exports.getToursWithin=catchAsync(async(req,res,next)=>{
    //lat lang is users current location
    const {distance,latlng,unit}=req.params;
    const[lat,lng]=latlng.split(',');

    const radius= unit === 'mi' ? distance/3963.2 : distance/6378.1;

    if(!lat || !lng){
        return next(new AppError('Please Provide Latitute and Longitude in the format lat,lng',400));
    }

    const tours= await Tour.find({startLocation: { $geoWithin : { $centerSphere :[[lng , lat], radius] } } })
    res.status(200).json({
        status:'success',
        results:tours.length,
        data:{
            data:tours
        }
    });
})

exports.getDistance=catchAsync(async(req,res,next)=>{
    //lat lang is users current location
    const {latlng,unit}=req.params;
    const[lat,lng]=latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371: 0.001;

    if(!lat || !lng){
        return next(new AppError('Please Provide Latitute and Longitude in the format lat,lng',400));
    }

    const distance= await Tour.aggregate([
        {
            $geoNear:{
                near:{
                    type:'Point',
                    coordinates:[lng * 1, lat * 1]
                },
                distanceField:'distance',
                distanceMultiplier:multiplier
            }
        },
        {
            $project:{
                distance:1,
                name:1
            }
        }
    ]);



    res.status(200).json({
        status:'success',
        data:{
            data:distance
        }
    });
})