class AppError extends Error{
    constructor(message,statusCode){
        super(message); //message is the only parameter that built in error accepts
        this.statusCode=statusCode;
        this.status=`${statusCode}`.startsWith('4')?'fail':'error';
        this.isOperational=true;

        Error.captureStackTrace(this,this.constructor);
    }
}
module.exports=AppError;


//errorstack shows where error happened