import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';


const router = Router();


router.post("/upload",async(req,res)=>{
    try{
    
        const {buffer} = req.body;
        
        const cloud = await cloudinary.uploader.upload(buffer);

        res.json({
            url: cloud.secure_url
        });

    }catch(error){
        res.status(500).json({
            message: error.message
        });
    }
});


export default router;