import kafka from "../config/kafka.js";

import {
    KAFKA_TOPICS
} from "../topics/topics.js";


const admin = kafka.admin();


export const connectAdmin = async () => {

    await admin.connect();

    console.log(
        "Kafka Admin connected"
    );
};


export const disconnectAdmin = async () => {

    await admin.disconnect();

    console.log(
        "Kafka Admin disconnected"
    );
};


export const createTopics = async () => {

    const topics = Object.values(
        KAFKA_TOPICS
    ).map((topic) => ({

        topic,

        numPartitions: 3,

        replicationFactor: 1

    }));


    await admin.createTopics({

        topics,

        waitForLeaders: true

    });

    console.log(
        "Kafka topics created/verified"
    );
};


const setup = async () => {

    try {

        await connectAdmin();

        //await createTopics();

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