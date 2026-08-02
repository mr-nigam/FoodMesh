class ApiResponse{
    constructor(
        statusCode,
        data,
        message = "Success",
        meta = {},
    ){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.meta = meta;
        this.success = statusCode < 400;
    }
};


export default ApiResponse;