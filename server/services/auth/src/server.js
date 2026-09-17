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

import {
    startAuthConsumer
} from './consumers/auth.js';


const startServer = async()=>{

    await bootstrapDB({
        connectDB,
        closeDB
    });

    await connectProducer();

    await startAuthConsumer();

    const PORT = process.env.PORT || 4000;
    
    app.listen(PORT,()=>{
        console.log(`🚀 Auth Server running on port: ${PORT}`);
    });
};


startServer();