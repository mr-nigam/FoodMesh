import crypto from "node:crypto";
import pool from "../config/postgre.js";
import kafka from "@foodmesh/kafka/src/config/kafka.js";
import { KAFKA_TOPICS, ensureTopicsExist } from "@foodmesh/kafka";


const BATCH_INTERVAL_MS = Number(process.env.LOCATION_HISTORY_BATCH_INTERVAL) || 60000;
const BATCH_SIZE_THRESHOLD = Number(process.env.LOCATION_HISTORY_BATCH_SIZE) || 500;

let consumer = null;
let buffer = [];
let flushTimer = null;
let isFlushing = false;


const buildBulkInsertQuery = (records) => {
    const valuePlaceholders = [];
    const values = [];
    let paramIndex = 1;

    for (const record of records){
        valuePlaceholders.push(
            `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
        );

        values.push(
            record.eventId,
            record.riderId,
            record.orderId,
            record.latitude,
            record.longitude,
            record.accuracy,
            record.speed,
            record.heading,
            record.sequence,
            record.recordedAt
        );
    }

    const query = `
        INSERT INTO rider_location_history (
            event_id,
            rider_id,
            order_id,
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
            sequence,
            recorded_at
        ) VALUES ${valuePlaceholders.join(", ")}
        ON CONFLICT (event_id) DO NOTHING;
    `;

    return { query, values };
};

const flushBatch = async () => {
    if (isFlushing || buffer.length === 0) return;
    isFlushing = true;

    // Take snapshot of current buffer
    const recordsToFlush = [...buffer];
    buffer = [];

    try {
        const { query, values } = buildBulkInsertQuery(recordsToFlush);
        await pool.query(query, values);

        // Compute highest offset per topic and partition
        if (consumer) {
            const partitionMaxOffsets = new Map();

            for (const record of recordsToFlush) {
                if (record.topic && record.partition !== undefined && record.offset !== undefined) {
                    const key = `${record.topic}:${record.partition}`;
                    const currentMax = partitionMaxOffsets.get(key);
                    const currentOffsetNum = BigInt(record.offset);

                    if (!currentMax || currentOffsetNum > BigInt(currentMax.offset)) {
                        partitionMaxOffsets.set(key, {
                            topic: record.topic,
                            partition: record.partition,
                            offset: String(currentOffsetNum + 1n)
                        });
                    }
                }
            }

            const offsetsToCommit = Array.from(partitionMaxOffsets.values());
            if (offsetsToCommit.length > 0) {
                await consumer.commitOffsets(offsetsToCommit);
            }
        }

        console.log(`[Location History] Successfully flushed ${recordsToFlush.length} records to PostgreSQL.`);
    } catch (err) {
        console.error(`[Location History] Failed to flush location batch to PostgreSQL:`, err.message);
        // Put unpersisted records back at the beginning of the buffer
        buffer = [...recordsToFlush, ...buffer];
    } finally {
        isFlushing = false;
    }
};

const startLocationHistoryConsumer = async () => {
    const topic = KAFKA_TOPICS.RIDER_LOCATION || "foodmesh.rider.location";

    await ensureTopicsExist([topic]);

    consumer = kafka.consumer({
        groupId: "delivery-location-history-group",
        sessionTimeout: 30000,
        rebalanceTimeout: 60000,
        heartbeatInterval: 3000
    });

    await consumer.connect();
    await consumer.subscribe({
        topic,
        fromBeginning: false
    });

    console.log(`✅ Location History Kafka Consumer subscribed to ${topic}`);

    // Start periodic 60-second flush timer
    flushTimer = setInterval(flushBatch, BATCH_INTERVAL_MS);

    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            if (!message.value) return;

            try {
                const parsed = JSON.parse(message.value.toString());
                const data = parsed.data || parsed;

                if (data && data.latitude !== undefined && data.longitude !== undefined) {
                    buffer.push({
                        eventId: data.eventId || parsed.eventId || crypto.randomUUID(),
                        riderId: data.riderId,
                        orderId: data.orderId,
                        latitude: Number(data.latitude),
                        longitude: Number(data.longitude),
                        accuracy: data.accuracy !== null && data.accuracy !== undefined ? Number(data.accuracy) : null,
                        speed: data.speed !== null && data.speed !== undefined ? Number(data.speed) : null,
                        heading: data.heading !== null && data.heading !== undefined ? Number(data.heading) : null,
                        sequence: Number(data.sequence || 1),
                        recordedAt: new Date(Number(data.timestamp || Date.now())),
                        topic,
                        partition,
                        offset: message.offset
                    });

                    // Flush immediately if buffer reaches size threshold
                    if (buffer.length >= BATCH_SIZE_THRESHOLD) {
                        await flushBatch();
                    }
                }
            } catch (err) {
                console.error("[Location History] Error buffering message:", err.message);
            }
        }
    });

    // Graceful shutdown handling
    const shutdown = async () => {
        if (flushTimer) clearInterval(flushTimer);
        console.log("[Location History] Flushing remaining location buffer before shutdown...");
        await flushBatch();
        if (consumer) {
            await consumer.disconnect().catch(() => {});
        }
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
};


export {
    startLocationHistoryConsumer,
    flushBatch,
    buildBulkInsertQuery,
    buffer as _locationBuffer
};
