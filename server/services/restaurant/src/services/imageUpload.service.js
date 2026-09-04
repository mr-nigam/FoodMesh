import axios from "axios";
import ApiError from "../utils/apiError.js";
import getBuffer from "../config/datauri.js";


const uploadImage = async (file) => {
    if(!file){
        throw new ApiError(
            400,
            "Please upload an image"
        );
    }

    const fileBuffer = getBuffer(file);

    if(!fileBuffer?.content){
        throw new ApiError(
            500,
            "Failed to create file buffer"
        );
    }

    try {
        const uploadResponse = await axios.post(
            `${process.env.UTILS_SERVICE}/upload`,
            {
                buffer: fileBuffer.content
            }
        );

        const pictureUrl =
            uploadResponse.data?.url ||
            uploadResponse.data?.data?.url;

        if(!pictureUrl){
            throw new ApiError(
                500,
                "Failed to upload image"
            );
        }

        return pictureUrl;

    }catch(error){
        if(error instanceof ApiError){
            throw error;
        }

        throw new ApiError(
            502,
            "Image upload service unavailable"
        );
    }
};

const uploadImages = async (files) => {
    if(!files || files.length === 0){
        throw new ApiError(
            400,
            "Please upload at least one image"
        );
    }

    const uploadPromises = files.map(
        file => uploadImage(file)
    );

    return await Promise.all(uploadPromises);
};


export {
    uploadImage,
    uploadImages
}