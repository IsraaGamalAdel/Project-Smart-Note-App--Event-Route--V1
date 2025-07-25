import joi from 'joi';
import { generalFields } from '../../middleware/validation.middleware.js';



// Joi Schema 
export const registrationValidationSchema = joi.object().keys({
    userName: generalFields.userName.required().messages({
        'string.empty': 'userName is required',
    }), // min 2 and max 50 as length
    email: generalFields.email.required(),
    password: generalFields.password.required(),
    confirmPassword: generalFields.confirmPassword.valid(joi.ref('password')).required(),
    phone: generalFields.phone.required(),
    'ln': generalFields.acceptLanguage
}).options({allowUnknown: false}).required();

// confirmEmail
export const confirmEmailValidationSchema = joi.object().keys({
    email: generalFields.email.required(),
    code: generalFields.code.required(),
    // code: joi.string().pattern(new RegExp(/^\d{6}$/)).required(), 
}).options({allowUnknown: false}).required();

// confirmEmail send Code
export const sendCodeOTPVerifyConfirmEmailValidationSchema = joi.object().keys({
    email: generalFields.email.required(), 
}).options({allowUnknown: false}).required();

// Login
export const loginValidationSchema = joi.object().keys({
    email: generalFields.email.required(),
    password: generalFields.password.required(),
    'ln': generalFields.acceptLanguage
}).options({allowUnknown: false}).required()

// google Login
export const googleLoginValidationSchema = joi.object().keys({
    email: generalFields.email.required(),
    password: generalFields.password.required(),
    googleId: generalFields.id.required(),
}).options({allowUnknown: false}).required()

// forgotPassword
export const forgotPasswordValidationSchema = joi.object().keys({
    email: generalFields.email.required(),
}).options({allowUnknown: false}).required()

// resetPassword
export const resetPasswordOTPValidationSchema = joi.object().keys({
    email: generalFields.email.required(),
    code: generalFields.code.required(),
    // code: joi.string().pattern(new RegExp(/^\d{6}$/)).required(),
    password: generalFields.password.required(),
    confirmPassword: generalFields.confirmPassword.valid(joi.ref('password')).required(),
}).options({allowUnknown: false}).required()
