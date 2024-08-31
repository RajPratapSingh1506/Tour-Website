const AppError=require('./../utils.js/appError');

const handleCastErrorDB =err=>{
    const message=`Invalid ${err.path}:${err.value}.`;
    return new AppError(message,400);
}

const handleDublicateFieldDB= err=>{
    const value=err.errmsg.match(/(["'])(\\?.)*\1/)[0] ;
    const message=`Dublicate Field value:${value} Please use another value!`;
    return new AppError(message,400);
}

const handleValidatorErrorDB=err=>{
    const errors=Object.values(err.errors).map(el=>el.message);
    const message=`Invalid input data. ${errors.join('. ')}`;
    return new AppError(message,400);
}

const handleJWTError =(err)=> new AppError('Invalid Token . Please login again',401);

const handleJWTExpiredError=(err)=> new AppError('Token Expired . Please login again',401)

const sendErrorDev=(err,req,res)=>{
    //API
    if(req.originalUrl.startsWith('/api')){
    return res.status(err.statusCode).json({
        status:err.status,
        error:err,
        message:err.message,
        stack:err.stack
    })
    }
        //  Rendered website
        console.log('Error',err);
        
        return res.status(err.statusCode).render('error',{
            title:'Something went wrong!!',
            msg:err.message
        });

};

const sendErrorProd=(err,req,res)=>{
// 1) API
    if(req.originalUrl.startsWith('/api')){
        //Operational ,trusted error: send msg to client
    if(err.isOperational){
        
        return res.status(err.statusCode).json({
            status:err.status,
            message:err.message //we get message from the object the error is initiated
        });
    
        }
        //Programming or ther unknown error: dont leak error details
            console.log('ERROR',err);
    
           return res.status(500).json({
                staus:'error',
                message:'Something might went wrong'
            });
    }
    // Rendered Website
    if(err.isOperational){
        
       return res.status(err.statusCode).render('error',{
            title:'Something went wrong!!',
            msg:err.message
        });

    }
    //Programming or ther unknown error: dont leak error details
        console.log('ERROR',err);

        return res.status(err.statusCode).render('error',{
            title:'Something went wrong!!',
            msg:'Please try again later!!'
        });
};


module.exports=(err,req,res,next)=>{
    err.statusCode= err.statusCode || 500;
    err.status= err.status || 'error';

    if(process.env.NODE_ENV ==='development'){
        sendErrorDev(err,req,res);
    }
    else if(process.env.NODE_ENV ==='production')
    {
        let error={...err};
        error.message=err.message;
        if(error.name==='CastError') error=handleCastErrorDB(error);
        if(error.code===11000) error=handleDublicateFieldDB(error);
        if(error.name==='ValidationError') error=handleValidatorErrorDB(error);
        if(error.name='JsonWebTokenError') error=handleJWTError(error);
        if(error.name='TokenExpiredError') error=handleJWTExpiredError(error);



        sendErrorProd(error,req,res);
    }
    
};