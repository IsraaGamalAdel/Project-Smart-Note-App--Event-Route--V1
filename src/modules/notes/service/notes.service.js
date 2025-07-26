//DB
import * as dbService from '../../../DB/db.service.js';
import { notesModel } from '../../../DB/model/notes.model.js';
import { roleTypes } from '../../../middleware/auth.middleware.js';
//utils
import { errorAsyncHandler } from '../../../utils/response/error.response.js';
import { successResponse } from '../../../utils/response/success.response.js';
//Multer
import cloudinary from './../../../utils/multer/cloudinary.js';



// create note
export const createNotes = errorAsyncHandler(
    async (req , res , next) => {

        if(req.files){
            const attachments = [];
            for (const file of req.files){
                const {secure_url , public_id} = await cloudinary.uploader.upload(file.path , { folder: `${process.env.APP_NAME}/Notes/attachments`});
                attachments.push({secure_url , public_id})
            }
            req.body.attachments = attachments
        }

        const note = await dbService.create({
            model: notesModel,
            data: {
                ...req.body,
                userId: req.user._id
            }
        })

        return successResponse({ res, message: `Successfully created note` , status: 201,
            data: {
                note
            }
        });
    }
);

// update note
export const updateNotes = errorAsyncHandler(
    async (req , res , next) => {

        if(req.files){
            const attachments = [];
            for (const file of req.files){
                const {secure_url , public_id} = await cloudinary.uploader.upload(file.path , { folder: `${process.env.APP_NAME}/Notes/attachments`});
                attachments.push({secure_url , public_id})
            }
            req.body.attachments = attachments
        }

        const updatedNote = await dbService.findOneAndUpdate({
            model: notesModel,
            filter: {
                _id: req.params.NoteId , 
                deleted: {$exists: false},
                userId: req.user._id
            },
            data: {
                ...req.body,
            },
            options: {
                new: true
            }
        })

        if(!updatedNote){
            return next(new Error("Note not found" , { cause: 404 }));
        }

        return successResponse({ res, message: `Successfully updated note` ,  status: 200,
            data: {
                updatedNote
            }
        });
    }
);

// delete & soft delete
export const deleteNotes = errorAsyncHandler(
    async (req , res , next) => {

        const deletedNote = await dbService.deleteOne({
            model: notesModel,
            filter: {
                _id: req.params.id,
                userId: req.user._id
            },
        })

        if(deletedNote.deletedCount === 0){
            return next(new Error("Note not found" , { cause: 404 }));
        }

        return successResponse({ res, message: `Successfully deleted note` ,  status: 200,  
            // data: {
            //     deletedNote
            // }
        })
    }
);

export const freezeNotes = errorAsyncHandler(
    async (req , res , next) => {

        const owner = req.user.role === roleTypes.Admin ? {} : {userId: req.user._id};

        const deletedNote = await dbService.findOneAndUpdate({
            model: notesModel,
            filter: {
                _id: req.params.NoteId , 
                deleted: {$exists: false},
                ...owner
            },
            data: {
                deleted: Date.now(),
                deletedBy: req.user._id
            },
            options: {
                new: true
            }
        })

        if(!deletedNote){
            return next(new Error("Note not found " , { cause: 404 }));
        }

        return successResponse({ res, message: `Successfully deleted note` ,  status: 200,  
            data: {
                deletedNote
            }
        });
    }
);

export const restoreNotes = errorAsyncHandler(
    async (req , res , next) => {

        const owner = req.user.role === roleTypes.Admin ? {} : {userId: req.user._id};

        const restoredNote = await dbService.findOneAndUpdate({
            model: notesModel,
            filter: {
                _id: req.params.NoteId , 
                deleted: {$exists: true},
                // ...owner
                deletedBy: req.user._id
            },
            data: {
                $unset: {
                    deleted: 0,
                    deletedBy: 0
                }
            },
            options: {
                new: true
            }
        })

        if(!restoredNote ){
            return next(new Error("Note not found " , { cause: 404 }));
        }

        return successResponse({ res, message: `Successfully restored note` ,  status: 200,  
            data: {
                restoredNote
            }
        });
    }
);