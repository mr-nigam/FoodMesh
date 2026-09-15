import '@foodmesh/utils/config/env';
import app from './app.js';

import{
    bootstrapDB
} from '@foodmesh/utils';

import {
    connectDB,
    closeDB
} from './config/postgre.js';

import {
    startOrderConsumer
} from './consumers/order.consumer.js';


const startServer = async()=>{

    await bootstrapDB({
        connectDB,
        closeDB
    });

    await startOrderConsumer();

    const PORT = process.env.PORT || 4009;

    app.listen(PORT,()=>{
        console.log(`🚀 Notification Server running on port: ${PORT}`);
    });
};


startServer();