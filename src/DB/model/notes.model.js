import  mongoose, { model, Schema, Types } from "mongoose";



const notesSchema =  new Schema({
    title : {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    content :{     
        type: String,
        trim: true, 
        required: function () {
            return this?.attachments?.length ? false : true;
        },
        minlength: [2 , `Content must be at least 2 characters`],
        maxlength: 20000,
    },
    // attachments
    attachments:[{secure_url: String , public_id: String}],

    //by user
    userId: {type: Types.ObjectId , ref: "User" , required: true},
    deletedBy: {type: Types.ObjectId , ref: "User" },
    createdAt: {type: Date , default: Date.now},

    deleted: Date ,

} , { 
    timestamps: true ,
    toObject: {virtuals: true},
    toJSON: {virtuals: true}
});

// Virtual for owner information
// notesSchema.virtual('owner', {
//     ref: 'User',
//     localField: 'userId',
//     foreignField: '_id',
//     justOne: true
// });


export const notesModel = mongoose.models.Note || model("Note" , notesSchema);