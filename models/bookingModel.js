const mongoose=require('mongoose');

const bookingSchema = new mongoose.Schema({
    tour:{
        type:mongoose.Schema.ObjectId,
        ref:'Tour',
        required:true
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true
    },
    price:{
        type: Number,
        required:true
    },
    createdAt:{
        type: Date,
        default: Date.now()
    },
    paid:{
        type: Boolean,
        default: true
    }

});

bookingSchema.pre(/^find/, function(next){
    this.populate('user').populate({
        path:'tour',
        select:'name'
    })
    next();
});

const Booking= mongoose.model('Booking',bookingSchema);
module.exports=Booking;