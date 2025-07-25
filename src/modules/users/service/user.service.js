import {userModel} from "../../../DB/model/User.model.js";
import { errorAsyncHandler } from "../../../utils/response/error.response.js";
import { successResponse } from "../../../utils/response/success.response.js";
import { decodeEncryption, generateEncryption } from "../../../utils/security/encryption.security.js";
import { compareHash, generateHash } from "../../../utils/security/hash.security.js";
import * as dbService from "../../../DB/db.service.js";
import { emailEvent } from './../../../utils/events/sendEmailEvent.js';
import cloudinary from './../../../utils/multer/cloudinary.js';
import { timeCodeOTP } from './../../../middleware/timeCode.middleware.js';
import fs  from 'node:fs';


// Profile
export const userProfile= errorAsyncHandler(
    async (req , res , next) => {

        const user = await dbService.findOne({
            model: userModel,
            filter: {_id: req.user._id} ,
            select: '-__v -_id -password -deleted  -confirmEmail',
            // populate: [
            //     {   
            //         path: "viewers.userId" ,select: "userName email DOB phone " 
            //     },
            // ]
        })

        if(!user){
            return next(new Error("In_valid account user not found" , {cause: 404}));
        }
        user.phone = user.getDecryptedMobile();

        const userData = user.toObject();
        delete userData.id;

        return successResponse({ 
            res, message: "Welcome User to your account (profile)" ,
            status:200 , 
            data: {users: userData}
        });
    }
);


// Update Profile
export const UpdateUserProfile = errorAsyncHandler(
    async (req, res, next) => {

        if (req.body.phone) {
            req.body.phone = generateEncryption({ plainText: req.body.phone });
        }

        const user = await dbService.findByIdAndUpdate({
            model: userModel,
            id: req.user._id,
            data: req.body,
            select: '-__v -_id -password -deleted  -confirmEmail',
            options: { new: true, runValidators: true },
        });

        if (!user) {
            return next(new Error("User not found", { cause: 404 }));
        }

        const userObject = user.toObject();
        delete userObject.id;

        return successResponse({
            res,
            message: "Welcome User to your account (Update profile)",
            status: 200,
            data: { user : userObject  },
        });
    }
);
// Update Password
export const UpdatePassword = errorAsyncHandler(
    async (req , res , next) => {
        const {oldPassword , password} = req.body;

        const user = await dbService.findOne({
            model: userModel,
            filter: { _id: req.user._id }
        });

        if (!user) {
            return next(new Error("User not found", { cause: 404 }));
        }

        if(!compareHash({plainText: oldPassword , hashValue: req.user.password})){
            return next(new Error("In_valid account user old password not match " ,{cause: 400}));
        }

        const hashPassword = generateHash({plainText: password});

        await dbService.findByIdAndUpdate({
            model: userModel,
            id: req.user._id,
            data: {password: hashPassword , changeCredentialsTime: Date.now()},
            options: {new: true , runValidators: true}
        })

        return successResponse({ res, message: "Welcome User to your account ( Update password to profile)" , status:200 });
    }
);

// Update Email
export const UpdateEmail = errorAsyncHandler(
    async (req , res , next) => {
        const {email} = req.body;

        if( await dbService.findOne({model: userModel, filter: {email}})){
            return next(new Error(`Email ${email} already exist` , {cause: 409}));
        }

        await dbService.updateOne({
            model: userModel,
            filter: {_id: req.user._id},
            data: {
                tempEmail: email
            }
        })
        emailEvent.emit("sendUpdateEmail" , {id: req.user._id ,email})  //send code to email the new account
        emailEvent.emit("sendConfirmEmail" , {id: req.user._id ,email: req.user.email})  // send code to old account

        return successResponse({ res, message: "Welcome User to your account ( Update password to profile)" , status:200 });
    }
);


export const replaceEmail = errorAsyncHandler(
    async (req , res , next) => {
        const { oldEmailCode , code} = req.body;

        const user = await dbService.findOne({ model: userModel, filter: { _id: req.user._id } });

        if (!user) {
            return next(new Error("User not found", { cause: 404 }));
        }

        if( await dbService.findOne({model: userModel, filter: {email: req.user.tempEmail}})){
            return next(new Error(`Email ${email} already exist` , {cause: 409}));
        }

        // // email code القديم  (email code القديم )
        // if(!compareHash({plainText: oldEmailCode , hashValue: req.user.emailOTP})){
        //     return next(new Error("In_valid account user old email code not match " ,{cause: 400}));
        // }

        // // code الجديد (email update code)
        // if(!compareHash({plainText: code , hashValue: req.user.updateEmailOTP})){
        //     return next(new Error("In_valid  verification code from your new email " ,{cause: 400}));
        // }

        // Validate old email code , email code القديم  (email code القديم )
        await timeCodeOTP(user, oldEmailCode, 'emailOTP');

        // Validate new email code , code الجديد (email update code)
        await timeCodeOTP(user, code, 'updateEmailOTP');

        await dbService.updateOne({
            model: userModel,
            filter: {_id: req.user._id},
            data: {
                email: req.user.tempEmail,
                changeCredentialsTime: Date.now(),
                $unset: {
                    tempEmail: 0,
                    updateEmailOTP: 0,
                    emailOTP: 0
                }
            }
        })

        return successResponse({ res, message: "Welcome User to your account ( Update email to profile)" , status:200 });
    }
);


// Update Image
export const updateImage = errorAsyncHandler(
    async (req, res, next) => {

        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `${process.env.APP_NAME}/users/image/${req.user._id}`,
        });

        const currentUser = await userModel.findById(req.user._id);

        const user = await dbService.findByIdAndUpdate({
            model: userModel,
            id: req.user._id,
            data: {
                profilePic: { secure_url, public_id },
            },
            options: { new: true, runValidators: true },
        });

        if (currentUser?.profilePic?.public_id) {
            await cloudinary.uploader.destroy(currentUser.profilePic.public_id);
        }

        return successResponse({
            res,
            message: "Welcome User to your account (Update images)",
            data: { user },
        });
    }
);

// Delete Image
export const deleteImage = errorAsyncHandler(
    async (req, res, next) => {
        const { public_id } = req.body;

        const deleteResult = await cloudinary.uploader.destroy(public_id);

        if (deleteResult.result !== "ok") {
            return next(new Error("Failed to delete image from Cloudinary"));
        }

        const user = await dbService.findByIdAndUpdate({
            model: userModel,
            id: req.user._id,
            data: {
                $unset: { profilePic: 0 },
            },
            options: { new: true, runValidators: true }, 
        });

        if (!user) {
            return next(new Error("User not found"));
        }

        return successResponse({
            res,
            message: "Profile image deleted successfully.",
            data: { user },
        });
    }
);

// Update Cover Images
export const coverImages = errorAsyncHandler(
    async (req , res , next) => {

        const images = [];

        for (const file of req.files){
            const {secure_url , public_id} = await cloudinary.uploader.upload(file.path , 
                { folder: `${process.env.APP_NAME}/users/coverImages/${req.user._id}`}
            );

            images.push({secure_url , public_id})
        }

        const user = await dbService.findByIdAndUpdate({
            model: userModel,
            id: req.user._id,
            data: { coverPic: images},
            options: {new: true}
        })
        
        return successResponse({ res, message: "Welcome User to your account ( Update profile)" , 
            data: {
                file: req.files,
                user
            }
        });
    }
);

// Delete cover images (one or all)
export const deleteCoverImages = errorAsyncHandler(
    async (req, res, next) => {
        const { public_id } = req.body;

        const user = await userModel.findById(req.user._id);
        if (!user) {
            return next(new Error("User not found"));
        }

        if (!user.coverPic || user.coverPic.length === 0) {
            return next(new Error("No images to delete."));
        }

        if (!public_id || public_id === "all") {
            for (const image of user.coverPic) {
                await cloudinary.uploader.destroy(image.public_id);
            }

            user.coverPic = [];
        } else {
            const imageToDelete = user.coverPic.find(img => img.public_id === public_id);

            if (!imageToDelete) {
                return next(new Error("Image not found."));
            }

            await cloudinary.uploader.destroy(public_id);

            user.coverPic = user.coverPic.filter(img => img.public_id !== public_id);
        }

        await user.save();

        return successResponse({
            res,
            message: public_id === "all" ? "All cover images deleted successfully." : "Cover image deleted successfully.",
            data: { user },
        });
    }
);

export const userIdentity1 = errorAsyncHandler(
    async (req , res , next) => {
        const profileImage = req.files.image[0];

        const updateData = {
            profilePic: {
                secure_url: req.files.image[0].finalPath,
                public_id: req.files.image[0].filename
            }
        };

        if (req.files.document) {
            updateData.document = {
                secure_url: req.files.document[0].finalPath,
                public_id: req.files.document[0].filename
            };
        }

        const user = await dbService.findByIdAndUpdate({
            model: userModel,
            id: req.user._id,
            data: updateData,
            // data: { coverPic: req.files.map(file => file.finalPath)},
            options: {new: true}
        })
        
        return successResponse({ res, message: "Welcome User to your account ( Update profile)" , 
            data: {
                file: req.files,
                user
            }
        });
    }
);

export const userIdentity = errorAsyncHandler(async (req, res, next) => {

    if (!req.files || (Object.keys(req.files).length === 0)) {
        return next(new Error("No files uploaded", { cause: 400 }));
    }

    const updateData = {};
    const currentUser = await dbService.findById({ 
        model: userModel, 
        id: req.user._id 
    });

    if (req.files.image && req.files.image[0]) {
        //delete old image
        if (currentUser?.profilePic?.secure_url) {
            try {
                fs.unlinkSync(path.resolve(`./src/${currentUser.profilePic.secure_url}`));
            } catch (err) {
                console.error("Error deleting old profile image:", err);
            }
        }
        updateData.profilePic = {
            secure_url: req.files.image[0].finalPath,
            public_id: req.files.image[0].filename
        };
    }

    if (req.files.document && req.files.document[0]) {
        //delete old document
        if (currentUser?.document?.secure_url) {
            try {
                fs.unlinkSync(path.resolve(`./src/${currentUser.document.secure_url}`));
            } catch (err) {
                console.error("Error deleting old document:", err);
            }
        }
        updateData.document = {
            secure_url: req.files.document[0].finalPath,
            public_id: req.files.document[0].filename
        };
    }

    if (Object.keys(updateData).length === 0) {
        return next(new Error("No valid files uploaded", { cause: 400 }));
    }

    const user = await dbService.findByIdAndUpdate({
        model: userModel,
        id: req.user._id,
        data: { $set: updateData },
        options: { new: true }
    });
    
    return successResponse({ 
        res, 
        message: "Files uploaded successfully",
        data: { user }
    });
});

export const coverImageIdentity1 = errorAsyncHandler(
    async (req , res , next) => {
        const newCoverPics = req.files.map(file => ({
            secure_url: file.finalPath,
            public_id: file.filename
        }));

        const user = await dbService.findByIdAndUpdate({
            model: userModel,
            id: req.user._id,
        data: {
            coverPic: newCoverPics 
        },
            options: {new: true}
        })
        
        return successResponse({ res, message: "Welcome User to your account ( Update profile)" , 
            data: {
                file: req.files,
                user
            }
        });
    }
);

export const coverImageIdentity = errorAsyncHandler(async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new Error("Please upload at least one file", { cause: 400 }));
    }

    const currentUser = await dbService.findById({
        model: userModel,
        id: req.user._id
    });
    const newFiles = [];

    if (req.files.images) {
        req.files.images.forEach(image => {
            newFiles.push({
                secure_url: image.finalPath,
                public_id: image.filename,
                type: 'images'
            });
        });
    }

    if (req.files.document) {
        req.files.document.forEach(doc => {
            newFiles.push({
                secure_url: doc.finalPath,
                public_id: doc.filename,
                type: 'documents'
            });
        });
    }

    const user = await dbService.findByIdAndUpdate({
        model: userModel,
        id: req.user._id,
        data: { 
            $push: { coverPic: { $each: newFiles } }
        },
        options: { new: true }
    });

    return successResponse({ 
        res, 
        message: `Files uploaded successfully: ${newFiles.length}`,
        data: { user }
    });
});
