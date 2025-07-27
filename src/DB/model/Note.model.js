import  mongoose, { model, Schema, Types } from "mongoose";



const notesSchema =  new Schema({
    title : {
        type: String,
        required: true,
        trim: true,
    },
    content :{     
        type: String,
        trim: true, 
        required: function () {
            return this?.attachments?.length ? false : true;
        },
        minlength: [2 , `userName minimum  2 characters`],
        maxlength: 20000,
    },

    // attachments
    attachments:[{secure_url: String , public_id: String}],
    //by user
    userId: {type: Types.ObjectId , ref: "User" , required: true},
    deletedBy: {type: Types.ObjectId , ref: "User" },
    createdAt: {type: Date , default: Date.now},

    // summary
    summary: String, 
    previousSummaries: [{
        summary: String,
        createdAt: { type: Date, default: Date.now }
    }],
    lastSummarizedAt: { type: Date, default: Date.now },

    //delete
    deleted: Date ,
    
},{
    timestamps:true ,
    toObject: {virtuals: true},
    toJSON: {virtuals: true}
});


export const notesModel = mongoose.models.Note || model("Note" , notesSchema);


