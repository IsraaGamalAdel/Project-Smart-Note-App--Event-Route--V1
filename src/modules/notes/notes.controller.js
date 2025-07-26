import { Router } from "express" ;
//validation
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from './notes.validation.js';
// Middleware
import { authentication, authorization, roleTypes } from "../../middleware/auth.middleware.js";
// service
import * as notesService from './service/notes.service.js';
// EndPoint
import { endPoint } from "./notes.endpoint.js";
// Multer
import { uploadCloudinaryFile } from './../../utils/multer/cloudinary.multer.js';
import { fileValidationTypes } from './../../utils/multer/local.multer.js';


const router = Router();


router.post('/create-note', 
    authentication(), authorization(endPoint.profile), 
    uploadCloudinaryFile(fileValidationTypes.image).array('image' , 3),
    validation(validators.createNoteValidation) , 
    notesService.createNotes
);


router.patch('/update-note/:NoteId', 
    authentication(), authorization(endPoint.profile), 
    uploadCloudinaryFile(fileValidationTypes.image).array('image' , 3),
    validation(validators.updateNoteValidation) , 
    notesService.updateNotes
);


router.delete('/delete-note/:id', 
    authentication(), authorization(endPoint.profile), 
    validation(validators.deleteNoteValidation) , 
    notesService.deleteNotes
);

router.delete('/freeze-note/:NoteId', 
    authentication(), authorization(endPoint.freezeNote), 
    validation(validators.deleteNoteValidation) , 
    notesService.freezeNotes
);


router.patch('/restore-note/:NoteId' , 
    authentication() , authorization(endPoint.freezeNote) , 
    validation(validators.deleteNoteValidation) ,
    notesService.restoreNotes
);






export default router;