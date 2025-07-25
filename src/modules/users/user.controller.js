import { Router } from "express";
import * as userService from './service/user.service.js'
import { authentication, authorization, roleTypes } from "../../middleware/auth.middleware.js";
import { endPoint } from "./user.endpoint.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from './user.validation.js';
import { fileValidationTypes, uploadDiskFile } from "../../utils/multer/local.multer.js";
import { uploadCloudinaryFile } from "../../utils/multer/cloudinary.multer.js";



const router = Router();

// userProfile
router.get('/profile' , 
    authentication() , 
    authorization(endPoint.profile) ,
    userService.userProfile
);

// UpdateUserProfile
router.patch('/update_User_Account' ,
    validation(validators.updateProfileValidation), 
    authentication(), authorization(endPoint.profile) ,  
    userService.UpdateUserProfile
);

// UpdatePassword
router.patch('/profile/password', 
    validation(validators.updatePasswordValidation), 
    authentication(), authorization(endPoint.profile), 
    userService.UpdatePassword
);

// Email
router.patch('/profile/email' , 
    validation(validators.updateEmailValidation) ,
    authentication() , 
    userService.UpdateEmail
);
router.patch('/profile/replace-email' , 
    validation(validators.replaceEmailValidation) ,
    authentication() , 
    userService.replaceEmail
);

// Images
router.patch('/profile/image', 
    authentication() ,  
    uploadCloudinaryFile( fileValidationTypes.image).single('image') , 
    userService.updateImage
);

router.patch('/profile/image/cover',
    authentication() , 
    uploadCloudinaryFile(fileValidationTypes.image).array('images' , 5) , 
    userService.coverImages
);

// Delete Images
router.delete('/profile/delete_image' , 
    validation(validators.deleteImageValidation) , 
    authentication() , 
    userService.deleteImage
);

router.delete('/profile/delete_images/cover' , 
    validation(validators.deleteImageValidation) , 
    authentication() , 
    userService.deleteCoverImages
);

// Identity images local
router.patch('/upload-profile-pic',authentication() , 
    uploadDiskFile("users/profile/identity" , 
        [...fileValidationTypes.image , ...fileValidationTypes.document], 
    ).fields([
        { name: 'image' , maxCount:1},
        { name: 'document' , maxCount:1}
    ]) , 
    userService.userIdentity
);

router.patch('/upload-cover-pic',authentication() , 
    uploadDiskFile("users/coverPic/identity" , 
        [...fileValidationTypes.image , ...fileValidationTypes.document],
    ).fields([
        { name: 'images' , maxCount:5},
        { name: 'documents' , maxCount:5}
    ]) , 
    userService.coverImageIdentity
);

export default router;


