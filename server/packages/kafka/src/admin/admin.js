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

const ensureTopicsExist = async (topicsToCheck = []) => {
    const tempAdmin = kafka.admin();
    try {
        await tempAdmin.connect();
        const existingTopics = await tempAdmin.listTopics();
        const allTargetTopics = Array.from(
            new Set([...(topicsToCheck || []), ...Object.values(KAFKA_TOPICS)])
        );
        const missing = allTargetTopics.filter(t => !existingTopics.includes(t));

        if (missing.length > 0) {
            console.log(`[Kafka] Creating missing topics: ${missing.join(", ")}`);
            await tempAdmin.createTopics({
                topics: missing.map(topic => ({
                    topic,
                    numPartitions: 3,
                    replicationFactor: 1
                })),
                waitForLeaders: true
            });
            console.log("[Kafka] Topics created and verified successfully");
        }
    } catch (error) {
        console.warn(`[Kafka] Warning during topic verification: ${error.message}`);
    } finally {
        await tempAdmin.disconnect().catch(() => {});
    }
};


export {
    connectAdmin,
    disconnectAdmin,
    createTopics,
    deleteTopics,
    ensureTopicsExist
};
