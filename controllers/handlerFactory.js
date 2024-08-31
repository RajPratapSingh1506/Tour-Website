// factory functions returns handler functions
const catchAsync=require('./../utils.js/catchAsync');
const AppError=require('./../utils.js/appError');
const APIFeatures=require('./../utils.js/apifeatures');


exports.deleteOne = Model => catchAsync(async(req,res,next)=>{
    const doc=  await Model.findByIdAndDelete(req.params.id);
    if(!doc){
      return next(new AppError('No document found with that id',404));
  }
 
      res.status(200).json({
          status:"Success",
          data:null
      });
 
});

exports.updateOne = Model => catchAsync(async (req,res,next)=>{
    const doc=await Model.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true
    });

    if(!doc){
        return next(new AppError('No document found with that ID',404));
    }
   
    res.status(200).json({
        status:"Success",
        data:{
            data:doc
        }
    })
});

exports.createOne= Model => catchAsync(async(req,res,next)=>{
    //const newTour= new Tour({})
    //newTour.save()   or   create
        const newDoc= await Model.create(req.body);
        res.status(201).json({
            status:"success",
            data:{
                data:newDoc
            }
        });
});

exports.getOne = (Model,popOptions) =>catchAsync(async(req,res,next)=>{

    let query=Model.findById(req.params.id);
    if(popOptions) query=query.populate(popOptions);

    const doc=await query;
    //findbyid is similar for Tour.findOne({_id:req.params.id})
    if(!doc){
        return next(new AppError('No document found with that id',404));
    }
    res.status(200).json({
        status:"Success",
        data:{
            data:doc
        }
    });
});

exports.getAll= Model => catchAsync(async(req,res,next)=>{

    //For Nested GET Reviews on TOUR
    let filter={};
    if(req.params.tourId) filter={tour:req.params.tourId}

    const features= new APIFeatures(Model.find(filter),req.query)
    .filter()
    .sort()
    .LimitFields()
    .paginate();

    const doc= await features.query;


    res.status(200).json({
    status:"Success",
    results:doc.length,
    data:{
        data:doc
    }
   });
});
