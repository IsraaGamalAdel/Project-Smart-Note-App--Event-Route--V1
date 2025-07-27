// GraphQL
import { GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";
// user types
import { imageType, userTypes } from "../../users/types/user.types.js";
// DB
import * as dbService from "../../../DB/db.service.js";
import { userModel } from "../../../DB/model/User.model.js";




export const notesTypes = new GraphQLObjectType({
    name: "notesType",
    fields: {
        _id: {type: GraphQLID},
        title: {type: GraphQLString},
        content: {type: GraphQLString},
        attachments: {type: new GraphQLList(
            imageType
        )},
        userId: {type: GraphQLID},
        userIdInfo: {
            type: userTypes,
            resolve: async(parent, args) => {
                return await dbService.findOne({
                    model: userModel,
                    filter: {
                        _id: parent.userId , 
                        deleted: false
                    }
                })
            }
        },
        deletedBy: {type: GraphQLID},
        deleted: {type: GraphQLString},
        createdAt: {type: GraphQLString},
        updatedAt: {type: GraphQLString},
    }
})


export const notesList = new GraphQLList( notesTypes )


export const  notesListResponse = new GraphQLObjectType({
    name: "notesList",
    fields:{
        statusCode: {type: GraphQLInt},
        message: {type: GraphQLString},
        data: {type: notesList}
    }
})