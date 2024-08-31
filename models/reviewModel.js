const mongoose=require('mongoose');
const Tour=require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review:{
        type:String,
        required:true
    },
    rating:{
        type:Number,
        min:1,
        max:5,
        set: val=> Math.round(val*10)/10//so that we get rounded value not 4.77777
    },
    createdAt:{
        type:Date,
        default: Date.now
    },
    tour:{
        type:mongoose.Schema.ObjectId,
        ref:'Tour',
        required:true
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true
    }
},
    {
        toJSON:{virtuals:true},
        toObject:{virtuals:true}
    }
);

//To Prevent user from posting more than one review
//combination of user and tour should be unique

reviewSchema.index({tour:1,user:1},{unique:true});

reviewSchema.pre(/^find/, function(next){
    this.populate({
        path:'user',
        select:'name photo'
    });
    next();
});

//In statics method this points to Model and we used cuz we wanted to call aggregate on model review
reviewSchema.statics.calcAverageRatings =  async function(tourId){

   const stats =await this.aggregate([
        {
            $match:{tour:tourId}
        },
        {
            $group:{
                _id:'$tour',
                nRating:{$sum:1},
                avgRating:{$avg:'$rating'}

            }
        }
    ]);
    console.log(stats);

    if(stats.length>0){
    await Tour.findByIdAndUpdate(tourId,{
        ratingsQuantity:stats[0].nRating,
        ratingsAverage:stats[0].avgRating
    })
    }
    else{
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity:0,
            ratingsAverage:4.5
        })
    }
    
}

reviewSchema.post('save',function(){
    // Here this points to current document i.e the data sent
    //console.log(this.tour);
    this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/,async function(next){
    this.r=await this.clone().findOne();//this provides us the review document
    //console.log(this.r);
    next();
})


reviewSchema.post(/^findOneAnd/,async function(){
    //await this.clone().find() does not work here cuz query is already executed
    await this.r.constructor.calcAverageRatings(this.r.tour);
})


const Review=mongoose.model('Review',reviewSchema);
module.exports=Review;