import '@foodmesh/utils/config/env';
import app from './app.js';

import {
    connectProducer
} from "@foodmesh/kafka";

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

    await connectProducer();

    const PORT = process.env.PORT || 4001;

    app.listen(PORT,()=>{
        console.log(`🚀 Restaurant Server running on port: ${PORT}`);
    });
};


startServer();