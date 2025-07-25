


export const successResponse = ({res, message = "success message", status = 200 , data = {}} = {}) => {
    return res.status(status).json({successMessage: message , data: {...data}});
};

