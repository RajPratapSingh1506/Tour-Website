const mongoose=require('mongoose');
const slugify=require('slugify');

const tourSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        maxlength:40,
        minlength:10
    },
    slug: String,
    duration:{
        type:Number,
        required:true
    },
    maxGroupSize:{
        type:Number,
        required:true
    },
    difficulty:{
        type:String,
        required:true,
        enum:['easy','medium','difficult']
    },
    ratingsAverage:{
        type:Number,
        default:4.5,
        min:1,
        max:5
    },
    ratingsQuantity:{
        type:Number,
        default:0
    },
    price:{
        type:Number,
        required:true
    },
    priceDiscount:{
        type:Number,
        validate:{
            validator: function(val){
                return val<this.price;
            }
        }
    },
    summary:{
        type:String,
        trim:true, //remove unwanted whitespace at start and end
        required:true

    },
    description:{
        type:String,
        required:true,
        trim:true
    },
    imageCover:{
        type: String,
        required:true
    },
    images:[String],
    createdAt:{
        type:Date,
        default: Date.now()
    },
    startDates:[Date],
    secretTour:{
        type: Boolean,
        default: false
    },
    startLocation:{
        //Geo JSON
        type:{
            type:String,
            default:'Point',
            enum:['Point']
        },
        coordinates:[Number],
        address:String,
        description:String
    },
    locations:[
        {
            type:{
                type:String,
                default:'Point',
                enum:['Point']
            },
            coordinates:[Number],
            address:String,
            description:String,
            day:Number
        }
    ],
    guides:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'User'
        }
    ]
},{
    toJSON:{
        virtuals:true
    },
    toObject:{
        virtuals:true
    }
}
);

// tourSchema.index({price:1});
tourSchema.index({price:1 , ratingsAverage: -1});
tourSchema.index({ slug: 1 });
tourSchema.index({startLocation: '2dsphere'});//2dsphere for location on earth surface

tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7;
  });


//Virtual populate.......reviews is what it will be called here
tourSchema.virtual('reviews',{
    ref:'Review',
    foreignField:'tour',//tour:{type:moongose....} in review schema
    localField:'_id'
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
  });

// tourSchema.pre('save',function(next){
//     console.log("Pre Save function");
//     next();
// });

// QUERY MIDDLEWARE
// tourSchema.pre('find', function(next) {
    tourSchema.pre(/^find/, function(next) {
        this.find({ secretTour: { $ne: true } });
      
        this.start = Date.now();
        next();
      });
      

tourSchema.pre(/^find/, function(next){
    this.populate({
        path:'guides',
        select:'-__v -passwordChangedAt'
    })
    next();
});

// tourSchema.post('save',function(doc,next) {
//     console.log(doc);
//     next();
    
// });

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

const Tour =mongoose.model('Tour',tourSchema);
module.exports=Tour;