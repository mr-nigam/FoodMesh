import '@foodmesh/utils/config/env';
import app from './app.js';
import { v2 as cloudinary } from 'cloudinary';


const { 
    CLOUDINARY_CLOUD_NAME, 
    CLOUDINARY_API_KEY, 
    CLOUDINARY_API_SECRET
} = process.env;

if(
    !CLOUDINARY_CLOUD_NAME || 
    !CLOUDINARY_API_KEY || 
    !CLOUDINARY_API_SECRET
){
    throw new Error("Missing Cloudinary envirenment variables");
}

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

const PORT = process.env.PORT || 4002;

app.listen(PORT,()=>{
    console.log(`🚀 Utils Server running on port: ${PORT}`);
});