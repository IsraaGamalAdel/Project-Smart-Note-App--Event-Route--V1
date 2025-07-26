import joi from 'joi';
import { generalFields } from '../../middleware/validation.middleware.js';



// createNote
export const createNoteValidation = joi.object().keys({
    title: generalFields.title.required(),
    content: generalFields.content.required(),
    file: joi.array().items(generalFields.files).max(3),
}).or( 'title' ,'content' ,'file');

// updateNote
export const updateNoteValidation = joi.object().keys({
    NoteId: generalFields.id.required(),
    title: generalFields.title,
    content: generalFields.content,
    file: joi.array().items(generalFields.files).max(3),
}).or( 'title' ,'content' ,'file');

// delete-Note
export const deleteNoteValidation = joi.object().keys({
    id: generalFields.id.required(),
}).required();

// freeze-Note
export const freezeNoteValidation = joi.object().keys({
    NoteId: generalFields.id.required(),
}).required();
