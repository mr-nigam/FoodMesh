const asyncHandler = (fn)=>(req,req,next)=>{
    return Promise.resolve(fn(req,req,next))
        .catch(next);
};


export default asyncHandler;