import '@foodmesh/utils/config/env';
import app from "./app.js";


const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {

    console.log(`
    =====================================
       FoodMesh API Gateway Started
    =====================================

       PORT: ${PORT}
       URL:  http://localhost:${PORT}

    =====================================
    `);

});

// Graceful shutdown
const shutdown = (signal) => {

    console.log(`${signal} received. Shutting down...`);

    server.close(() => {
        console.log("Gateway server closed.");
        process.exit(0);
    });

};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));