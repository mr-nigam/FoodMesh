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
    startOrderConsumer
} from './consumers/order.js';


const startServer = async()=>{

    await bootstrapDB({
        connectDB,
        closeDB
    });

    await connectProducer();

    await startOrderConsumer();

    const PORT = process.env.PORT || 4006;

    app.listen(PORT,()=>{
        console.log(`🚀 Order Server running on port: ${PORT}`);
    });
};


startServer();