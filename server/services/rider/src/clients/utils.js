import axios from 'axios';
import getBuffer from '../config/datauri.js';

import { 
    ApiError
} from '@foodmesh/utils';


const uploadFile = async({
    file
})=>{
    
    if(!file){
        return null;
    }
    
    const fileBuffer = getBuffer(file);

    if(!fileBuffer?.content){
        throw new ApiError(
            500,
            "Failed to create file buffer"
        );
    }

    const utilsServiceUrl = 
        process.env.UTILS_SERVICE || 
        "http://localhost:4002/api/v1/utils";

    const {data} = await axios.post(
        `${utilsServiceUrl}/upload`,
        { buffer: fileBuffer.content}
    );

    const pictureUrl = 
        data?.url ?? 
        data?.data?.url ??
        null;
 
    if(!pictureUrl){
        throw new ApiError(
            500,
            "Failed to upload image"
        );
    }

    return pictureUrl;
};


export {
    uploadFile
};