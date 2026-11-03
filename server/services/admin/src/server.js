import '@foodmesh/utils/config/env';
import app from './app.js';

import{
    bootstrapDB
} from '@foodmesh/utils';

import {
    connectDB,
    closeDB
} from './config/postgre.js';


const startServer = async()=>{

    await bootstrapDB({
        connectDB,
        closeDB
    });

    const PORT = process.env.PORT || 4011;

    app.listen(PORT,()=>{
        console.log(`🚀 Admin Server running on port: ${PORT}`);
    });
};


startServer();