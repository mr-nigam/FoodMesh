import app from './app.js';

import bootstrapDB from 
'./bootstrap/db.bootstrap.js';


const startServer = async()=>{

    await bootstrapDB();

    const PORT = process.env.PORT || 4000;
    
    app.listen(PORT,()=>{
        console.log(`🚀 Auth Server running on port: ${PORT}`);
    });
};


startServer();