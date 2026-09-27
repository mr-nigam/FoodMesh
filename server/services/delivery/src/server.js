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
    startDeliveryConsumer
} from './consumers/delivery.js';


const startServer = async()=>{
    
    await bootstrapDB({
        connectDB,
        closeDB
    });
    
    await connectProducer();

    await startDeliveryConsumer();

    const PORT = process.env.PORT || 4011;

    app.listen(PORT,()=>{
        console.log(`🚀 Delivery Server running on port: ${PORT}`);
    });
};


startServer();