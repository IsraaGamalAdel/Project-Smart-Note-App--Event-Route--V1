// GraphQL
import { GraphQLObjectType, GraphQLSchema } from "graphql";
// Modules Resolvers query
import * as notesQueryResolve  from "./notes/resolve/query.resolve.js";
import * as userQueryResolve  from "./users/resolver/user.query.resolver.js";




export const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'querySchema',
        description: "Query Schema All Project Modules",
        fields: {
            ...notesQueryResolve,
            ...userQueryResolve
        }
    }),

})