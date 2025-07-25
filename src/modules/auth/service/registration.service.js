import { userModel } from "../../../DB/model/user.model.js";


export const signup = async (req ,res ,next) =>{
    try{
        const users = await userModel.insertOne(req.body);
        return res.status(201).json({ message: 'signup' ,users });
    }catch(err){
        return res.status(500).json({ message: 'internal server error' , err , message:err.message , stack: err.stack });
    }
};