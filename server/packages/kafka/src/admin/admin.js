import kafka from "../config/kafka.js";

import {
    KAFKA_TOPICS
} from "../topics/topics.js";


const admin = kafka.admin();


const connectAdmin = async () => {

    await admin.connect();

    console.log(
        "Kafka Admin connected"
    );
};

const disconnectAdmin = async () => {

    await admin.disconnect();

    console.log(
        "Kafka Admin disconnected"
    );
};

const createTopics = async () => {

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

const deleteTopics = async () => {

    const topics = Object.values(KAFKA_TOPICS);

    await admin.deleteTopics({
        topics
    });

    console.log(
        "Kafka topics deleted:",
        topics
    );

};


export {
    connectAdmin,
    disconnectAdmin,
    createTopics,
    deleteTopics
}