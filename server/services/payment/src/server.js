import 'dotenv/config';
import app from './app.js';

import bootstrapDB from 
'./bootstrap/db.bootstrap.js';


const startServer = async()=>{

    await bootstrapDB();

    const PORT = process.env.PORT || 4008;

    app.listen(PORT,()=>{
        console.log(`🚀 Payment Server running on port: ${PORT}`);
    });
};


startServer();