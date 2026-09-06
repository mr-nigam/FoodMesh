import {
    connectAdmin,
    createTopics,
    disconnectAdmin
} from "./admin.js";


const setup = async () => {

    try {

        await connectAdmin();

        await createTopics();

    } catch (error) {

        console.error(
            "Kafka topic setup failed:",
            error
        );

        process.exitCode = 1;

    } finally {

        await disconnectAdmin();

    }

};


setup();
// npm run kafka:topics