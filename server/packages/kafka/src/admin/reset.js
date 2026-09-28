import {
    connectAdmin,
    createTopics,
    deleteTopics,
    disconnectAdmin
} from "./admin.js";


const reset = async () => {

    try {

        await connectAdmin();

        console.log("Deleting FoodMesh Kafka topics...");

        await deleteTopics();

        console.log("Recreating FoodMesh Kafka topics...");

        await createTopics();

        console.log("Kafka reset completed successfully.");

    } catch (error) {

        console.error(
            "Kafka reset failed:",
            error
        );

        process.exitCode = 1;

    } finally {

        await disconnectAdmin();

    }

};


reset();