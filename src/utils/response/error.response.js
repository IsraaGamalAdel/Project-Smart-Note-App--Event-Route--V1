import path from 'path';
import * as dotenv from 'dotenv';

// dotenv.config({path:(path.resolve('./config/.env.prod'))});


export const errorAsyncHandler = (fn) => {
    return (req ,res ,next) => {
        return fn( req ,res ,next).catch(error => {
            error.status = 500;
            return next(error); 
        })
    }
};

export const globalErrorHandling = (error , req ,res ,next) => {
    if (error){
        if(process.env.MOOD == "development"){
            return res.status(error.cause || 400).json({ message:error.message, error, stack:error.stack});
        }
        return res.status(error.cause || 400).json({message:error.message});
    }
};

