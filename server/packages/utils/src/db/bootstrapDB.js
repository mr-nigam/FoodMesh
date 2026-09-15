const bootstrapDB = async ({
    connectDB,
    closeDB
}) => {

    try{
        await connectDB();

        console.log("✅ PostgreSQL Connected");

    }catch(error){

        console.error("❌ PostgreSQL Connection Failed");
        console.error(error);

        process.exit(1);
    }

    const shutdown = async (signal) => {

        try{

            await closeDB();

            console.log(`🛑 PostgreSQL Pool Closed (${signal})`);

            process.exit(0);

        }catch(error){

            console.error("❌ PostgreSQL Pool Close Failed");
            console.error(error);

            process.exit(1);
        }
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
};


export {
    bootstrapDB
}