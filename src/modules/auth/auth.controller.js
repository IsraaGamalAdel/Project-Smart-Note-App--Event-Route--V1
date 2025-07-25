import { Router } from "express" ;
//validation
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from './auth.validation.js';
// service
import * as registrationService from './service/registration.service.js';
import * as forgotPassword from "./service/forgotPassword.service.js";
import * as loginService from './service/login.service.js';



const router = Router();

// Sign Up
router.post('/registration',validation(validators.registrationValidationSchema) ,registrationService.registrationService);

// confirmEmail
router.patch("/confirm_email", validation(validators.confirmEmailValidationSchema) , registrationService.VerifyConfirmEmail);
router.patch("/sendCode_confirm_email", validation(validators.sendCodeOTPVerifyConfirmEmailValidationSchema) , registrationService.sendCodeOTPVerifyConfirmEmail);


// login
router.post("/login", validation(validators.loginValidationSchema) , loginService.login);
// login to email
router.post("/loginWithGmail" , loginService.signIn);

// refresh Token
router.get("/refreshToken" , loginService.refreshToken);

// forgotPassword OTP
router.patch("/forgot_Password" ,validation(validators.forgotPasswordValidationSchema) ,forgotPassword.forgotPasswordOTP);
router.patch("/reset_Password" , validation(validators.resetPasswordOTPValidationSchema) ,forgotPassword.resetPasswordOTP);


export default router;



