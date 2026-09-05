import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import uploadFile from '../middlewares/multer.js';


const router = Router();


router.post("/upload", uploadFile, async (req, res) => {
    try {
        let fileBuffer = req.file?.buffer;

        if (!fileBuffer && req.body?.buffer) {
            fileBuffer = Buffer.isBuffer(req.body.buffer)
                ? req.body.buffer
                : Buffer.from(req.body.buffer, 'base64');
        }

        if (!fileBuffer) {
            return res.status(400).json({ message: "No file or buffer provided" });
        }

        const uploadStream = () => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { resource_type: "auto" },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                stream.end(fileBuffer);
            });
        };

        const cloud = await uploadStream();

        return res.json({
            url: cloud.secure_url
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
});


export default router;