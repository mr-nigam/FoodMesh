// Central env loader
import '@foodmesh/utils/config/env';
import app from './app.js';

import {
    connectProducer
} from "@foodmesh/kafka";


import bootstrapDB from 
'./bootstrap/db.bootstrap.js';


const startServer = async()=>{

    await bootstrapDB();

    await connectProducer();

    const PORT = process.env.PORT || 4006;

    app.listen(PORT,()=>{
        console.log(`🚀 Order Server running on port: ${PORT}`);
    });
};


startServer();