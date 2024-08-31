const express= require('express');
const path=require('path');
const fs=require('fs');
const dotenv=require('dotenv');
const morgan=require('morgan');
const mongoose=require('mongoose');
const rateLimit=require('express-rate-limit');
const helmet=require('helmet');
const mongoSanitize=require('express-mongo-sanitize');
const xss=require('xss-clean');
const hpp=require('hpp');//prevent parameter pollution
const cookieparser=require('cookie-parser');

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
  });

dotenv.config({path:'./config.env'});

mongoose.connect(process.env.DATABASE_LOCAL,{
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(()=>{
    console.log("Database Connected");
}).catch((err)=>{
    console.log("Error connecting to the database");
});

const globalErrorHandler=require('./controllers/errorController');
const AppError=require('./utils.js/appError');
const tourRouter=require('./routes/tourRoutes');
const userRouter=require('./routes/userRoutes');
const reviewRouter=require('./routes/reviewRoutes');
const viewRouter=require('./routes/viewRoutes');
const bookingRouter=require('./routes/bookingRoutes');
const cookieParser = require('cookie-parser');
const { log } = require('console');


const app=express();

app.use((req,res,next)=>{
    res.setHeader(
    'Content-Security-Policy',
    "script-src 'self' https://cdnjs.cloudflare.com https://js.stripe.com/v3/"
);
next();
}

);

app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'));


//serving static files
app.use(express.static(path.join(__dirname,'public')));

//security http headers
app.use(helmet());//we are calling helmet() cuz it will give another function

app.use((req,res,next)=>{
    res.setHeader(
    'Content-Security-Policy',
    "script-src 'self' https://cdnjs.cloudflare.com https://js.stripe.com/v3/"
);
next();
}

);

// app.use(
//     helmet.contentSecurityPolicy({
//         directives:{
//             defaultSrc:["'self'"],
//             baseUri:["'self'"],
//             fontSrc:["'self'",'https:','data:'],
//             scriptSrc:["'self'",'https://*.cloudflare.com'],
//             objectSrc:["'none'"],
//             styleSrc:["'self'",'https:','unsafe-inline'],
//             upgradeInsecureRequests:[],
//         }
//     })
// )

//Developmet logging
if(process.env.NODE_ENV === 'development'){
    //console.log("Development Server Started");
    
    app.use(morgan('dev'));
}

//limit the no of request
const limiter=rateLimit({
    max:100,//No. of Limits
    window:60*60*1000,
    message:"Too many requests from this IP. Please try again in an hour!"
});
app.use('/api',limiter);

//(Middleware) Body Parser, reading data from req.body
app.use(express.json({limit:'10kb'}));
app.use(cookieParser());
app.use(express.urlencoded({extended:true , limit:'10kb'}));

// Data Sanitization against NoSQL query injection i.e login without email only with password that can be dangerous using db query
app.use(mongoSanitize());//filters all the dollar sign from body params

//Data Sanitization against xss
app.use(xss());

//prevent parameter pollution
app.use(hpp({
    whitelist:['duration','ratingsQuantity','ratingsAverage','maxGroupSize','price','difficulty']//things which are allowed to dublicate are in whitelist here
}));

console.log("Correct");


app.use((req,res,next)=>{
    req.requestedTime=new Date().toISOString();
    next();
})

//Mounting of routes


app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings',bookingRouter);
app.use('/',viewRouter);


// This will only be executed when routes are not matched with the above one
app.all('*',(req,res,next)=>{
    // const err= new Error(`Can't find ${req.originalUrl} on this server`);
    // err.status='fail',
    // err.statusCode=404;
    // next(err);
    next(new AppError(`Can't find ${req.originalUrl} on this server`,404));
});

//Error Middleware contains four arguments err,req,res,next
app.use(globalErrorHandler );

const port=process.env.PORT || 3000;
app.listen(port,()=>{
    console.log(`Server started at port:${port}`);
});

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
  