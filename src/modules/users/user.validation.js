import joi from 'joi';
import { generalFields } from '../../middleware/validation.middleware.js';


// updateProfile
export const updateProfileValidation = joi.object().keys({
    firstName: generalFields.userName,
    lastName: generalFields.userName,
    phone: generalFields.phone,
    gender: generalFields.gender,
    DOB: generalFields.DOB
}).required();

// updatePassword
export const updatePasswordValidation = joi.object().keys({
    oldPassword: generalFields.password.required(),
    password: generalFields.password.not(joi.ref('oldPassword')).required(),
    confirmPassword: generalFields.confirmPassword.valid(joi.ref('password')).required(),
}).required();

// updateEmail
export const updateEmailValidation = joi.object().keys({
    email: generalFields.email.required(),
}).required();


export const replaceEmailValidation = joi.object().keys({
    oldEmailCode: generalFields.code.required(), // email code القديم  (email code القديم )
    code: generalFields.code.required(), // code الجديد (email update code)
}).required();

// deleteImage
export const deleteImageValidation = joi.object().keys({
    public_id: joi.string().required(),
}).required();

