import '@foodmesh/utils/config/env';
import app from './app.js';

import bootstrapDB from 
'./bootstrap/db.bootstrap.js';


const startServer = async()=>{

    await bootstrapDB();

    const PORT = process.env.PORT || 4003;

    app.listen(PORT,()=>{
        console.log(`🚀 User Server running on port: ${PORT}`);
    });
};


startServer();