// DB
import * as dbService from "../../../DB/db.service.js";
import { notesModel } from './../../../DB/model/notes.model.js';
// Types
import * as notesTypes from "../types/notes.types.js";




export const allNotesList = {
    type: notesTypes.notesListResponse , 
    resolve: async (parent , args) =>  {
        const notes = await dbService.findAll({model: notesModel })
        return { statusCode: 200 , message: "Success All Notes" , data: notes};
    }
};



