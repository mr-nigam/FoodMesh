import 'dotenv/config';
import app from './app.js';

import bootstrapDB from 
'./bootstrap/db.bootstrap.js';


const startServer = async()=>{

    await bootstrapDB();

    const PORT = process.env.PORT || 4001;
    console.log(PORT);
    console.log("Restaurant routes loaded");

    // console.log(
    //     app.router.stack.map((layer) => ({
    //         name: layer.name,
    //         path: layer.route?.path,
    //         methods: layer.route?.methods,
    //     }))
    // );

    app.listen(PORT,()=>{
        console.log(`🚀 Restaurant Server running on port: ${PORT}`);
    });
};


startServer();