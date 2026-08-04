import ApiError from '../utils/apiError.js';


const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let errors = [];

    // Handle custom ApiError
    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors || [];
    }

    // Handle PostgreSQL errors
    else if(err.code){
        switch(err.code){
            // Unique constraint violation
            case "23505": {
                statusCode = 409;

                const field = err.detail?.match(/\((.*?)\)/)?.[1];

                message = field
                    ? `${field} already exists`
                    : "Resource already exists";
                break;
            }

            // Foreign key violation
            case "23503":
                statusCode = 409;
                message = "Referenced resource does not exist";
                break;

            // NOT NULL violation
            case "23502":
                statusCode = 400;
                message = `${err.column} is required`;
                break;

             // Invalid UUID / invalid input syntax
            case "22P02":
                statusCode = 400;
                message = "Invalid input";
                break;

             // Check constraint violation
            case "23514":
                statusCode = 400;
                message = "Constraint validation failed";
                break;

            default:
                console.error({
                    method: req.method,
                    url: req.originalUrl,
                    error: err,
                });

                message = err.message || message;
        }

    }else{
        console.error({
            method: req.method,
            url: req.originalUrl,
            error: err,
        });
    }

    return res
        .status(statusCode)
        .json({
            success: false,
            statusCode,
            message,
            errors,
            ...(process.env.NODE_ENV === "development" && {
                stack: err.stack,
                code: err.code,
            }),
        });
};


export default errorHandler;