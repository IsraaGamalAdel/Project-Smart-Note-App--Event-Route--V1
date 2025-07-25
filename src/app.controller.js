//limiter
import rateLimit from 'express-rate-limit';
//helmet
import helmet from 'helmet';
//cors origin resource sharing
import cors from 'cors'; // upload Deployment 
//morgan http request logger
import morgan from 'morgan';
// DB connection
import connectDB from './DB/connection.js';
// utils error
import { globalErrorHandling } from './utils/response/error.response.js';
// controller
import authController from './modules/auth/auth.controller.js';
import usersController from './modules/users/user.controller.js';




// API
const url = '/api/v1'


const limiter = rateLimit({
    limit: 5,
    windowMs: 3 * 60 * 1000,
});


const bootstrap = async (app , express) => {
    
    // app.use(morgan('short')); // prediction
    app.use(morgan('dev')); // development
    app.use(helmet());
    app.use(cors());
    app.use(limiter);
    
    // upload file size
    app.use(express.urlencoded({ limit: '100mb', extended: true }));

    // body parser express
    app.use(express.json());

    // test true routing
    app.get('/' , (req , res ,next) => {
        return res.status(200).json({
            message : "hello world"
        })
    });

    app.use(`${url}/auth`, authController);
    app.use(`${url}/users` , usersController);


    app.use(globalErrorHandling);

    // in-valid routing (All routing)
    app.all('*' , (req , res , next) => {
        return res.status(404).json({
            message : "In-valid routing"
        });
    });

    connectDB();
};


export default bootstrap;

