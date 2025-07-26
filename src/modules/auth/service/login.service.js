// DB
import * as dbService from '../../../DB/db.service.js';
import {providerTypes, userModel} from "../../../DB/model/User.model.js";
// Middleware
import { roleTypes } from '../../../middleware/auth.middleware.js';
// Utils
import { errorAsyncHandler } from "../../../utils/response/error.response.js";
import { successResponse } from '../../../utils/response/success.response.js';
// Token
import {  decodeToken, generateToken, tokenTypes } from "../../../utils/token/token.js";
// Security hash
import { compareHash } from "../../../utils/security/hash.security.js";
// Security google auth
import {OAuth2Client} from 'google-auth-library' ;



//signIn With Email
export const signIn = errorAsyncHandler(
    async (req, res, next) => {
        const { idToken } = req.body;

        const client = new OAuth2Client();
        async function verify() {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.WEB_CLIENT_ID
            });
            const payload = ticket.getPayload();
            return payload
        }
        const payload = await verify()

        if(!payload.email_verified){
            return next(new Error("In-valid account ID Google payload", { cause: 404 }));
        }

        let user = await dbService.findOne({
            model: userModel,
            filter: { email: payload.email },
        });

        if (!user) {
            user = await dbService.create({
                model: userModel,
                data: {
                    userName: payload.name,
                    email: payload.email,
                    confirmEmail: payload.email_verified,
                    image: payload.picture,
                    provider: providerTypes.google
                }
            })
        }

        if (user.provider != providerTypes.google) {
            return next(new Error("In-valid provider type", { cause: 400 }));        
        }

        const accessToken = generateToken({
            payload: { id: user._id, isLoggedIn: true },
            signature:
                user.role === roleTypes.Admin
                    ? process.env.SYSTEM_ACCESS_TOKEN
                    : process.env.USER_ACCESS_TOKEN,
            options: { expiresIn: "1h" },
        });

        const refreshToken = generateToken({
            payload: { id: user._id, isLoggedIn: true },
            signature:
                user.role === roleTypes.Admin
                    ? process.env.SYSTEM_REFRESH_TOKEN
                    : process.env.USER_REFRESH_TOKEN,
            options: { expiresIn: "7d" },
        });

        return successResponse({
            res,
            message: "Welcome User to your account (login)",
            status: 200,
            data: {
                token: {
                    accessToken,
                    refreshToken,
                },
                user: {
                    _id: user._id,
                    userName: user.userName,
                    role: user.role,
                },
            },
        });
    }
);

export const login = errorAsyncHandler(
    async (req, res, next) => {

        const { email , password} = req.body;
        
        const user = await dbService.findOne({
            model: userModel,
            filter: {
                email ,
                provider: providerTypes.system,
                // deleted: { $exists: false }
            }
        });

        if(!user){
            return next(new Error("In_valid account user not found or not provider " , {cause: 404}));
        }
        if(!user.confirmEmail){
            return next(new Error("In_valid account user not confirmEmail" , {cause: 401}));
        }

        // Password compareHash
        const match = compareHash({
            plainText: password,
            hashValue: user.password
        }) // match password and hash password  // password to frontend and hash password to DB
        
        if(!match){
            return next(new Error("In_valid account password not match" ,{cause: 404}));
        }

        // Password virtual
        // const isMatch = await user.comparePassword(password);
        // if (!isMatch) {
        //     return next(new Error("In_valid account password not match" , { cause: 404 }));
        // }
        
        user.deleted = false;
        user.changeCredentialsTime = Date.now();
        await user.save();

        const accessToken = generateToken({
            payload: {id:user._id , isLoggedIn :true},
            signature: user.role ===  roleTypes.Admin ? process.env.SYSTEM_ACCESS_TOKEN : process.env.USER_ACCESS_TOKEN 
        })
        const refreshToken = generateToken({
            payload: {id:user._id , isLoggedIn :true},
            signature: user.role === roleTypes.Admin ? process.env.SYSTEM_REFRESH_TOKEN : process.env.USER_REFRESH_TOKEN ,
            options: {expiresIn: process.env.SYSTEM_EXPIREINTOKEN}
        })
        return successResponse({ res, message:"Welcome User to your account (login)", status:200 ,
            data: {
                token: {
                    accessToken,
                    refreshToken
                },
                user: {
                    _id: user._id,
                    userName: user.userName,
                    role: user.role,
                },
            }
        });
    }
);


export const refreshToken = errorAsyncHandler(
    async (req , res , next) => {
        
        const user = await decodeToken({authorization: req.headers.authorization , tokenType: tokenTypes.refresh , next})

        const accessToken = generateToken({
            payload: {id:user._id , isLoggedIn :true},
            signature: user.role ===  roleTypes.Admin ? process.env.SYSTEM_ACCESS_TOKEN : process.env.USER_ACCESS_TOKEN 
        })
        const refreshToken = generateToken({
            payload: {id:user._id , isLoggedIn :true},
            signature: user.role === roleTypes.Admin ? process.env.SYSTEM_REFRESH_TOKEN : process.env.USER_REFRESH_TOKEN ,
            options: {expiresIn: process.env.SYSTEM_EXPIREINTOKEN}
        })

        return successResponse({ res, message:"Welcome User to your account (refresh token success)", status:200 ,
            data: {
                token: {
                    accessToken,
                    refreshToken
                },
                user: {
                    _id: user._id,
                    userName: user.userName,
                    role: user.role,
                },
            }
        });
    }
);


