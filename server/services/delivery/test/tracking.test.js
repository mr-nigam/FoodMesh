import test from "node:test";
import assert from "node:assert/strict";
import {
    validateLocationInput,
    validateMovementPlausibility,
    haversineDistanceMeters
} from "../src/validators/validateLocation.js";
import { createLocationEvent } from "@foodmesh/kafka";
import { createTrackingRateLimiter } from "../src/middlewares/trackingRateLimiter.js";
import { buildBulkInsertQuery } from "../src/consumers/locationHistoryConsumer.js";
import { ApiError } from "@foodmesh/utils";

test("Tracking Validation - validateLocationInput", async (t) => {
    await t.test("accepts valid input", () => {
        const payload = {
            orderId: "order-12345",
            latitude: 31.326,
            longitude: 75.5762,
            accuracy: 8.5,
            speed: 32.5,
            heading: 120,
            timestamp: Date.now(),
            sequence: 15
        };

        const result = validateLocationInput(payload);
        assert.equal(result.orderId, "order-12345");
        assert.equal(result.latitude, 31.326);
        assert.equal(result.longitude, 75.5762);
        assert.equal(result.accuracy, 8.5);
        assert.equal(result.speed, 32.5);
        assert.equal(result.heading, 120);
        assert.equal(result.sequence, 15);
    });

    await t.test("rejects missing or empty orderId", () => {
        assert.throws(
            () => validateLocationInput({ latitude: 31.3, longitude: 75.5, timestamp: Date.now(), sequence: 1 }),
            (err) => err instanceof ApiError && err.statusCode === 400 && err.message.includes("orderId")
        );
        assert.throws(
            () => validateLocationInput({ orderId: "   ", latitude: 31.3, longitude: 75.5, timestamp: Date.now(), sequence: 1 }),
            (err) => err instanceof ApiError && err.statusCode === 400 && err.message.includes("orderId")
        );
    });

    await t.test("rejects invalid latitude and longitude", () => {
        assert.throws(
            () => validateLocationInput({ orderId: "1", latitude: 95.0, longitude: 75.5, timestamp: Date.now(), sequence: 1 }),
            (err) => err instanceof ApiError && err.statusCode === 400 && err.message.includes("Latitude")
        );
        assert.throws(
            () => validateLocationInput({ orderId: "1", latitude: 31.0, longitude: 195.0, timestamp: Date.now(), sequence: 1 }),
            (err) => err instanceof ApiError && err.statusCode === 400 && err.message.includes("Longitude")
        );
        assert.throws(
            () => validateLocationInput({ orderId: "1", latitude: "invalid", longitude: 75.0, timestamp: Date.now(), sequence: 1 }),
            (err) => err instanceof ApiError && err.statusCode === 400
        );
    });

    await t.test("rejects invalid sequence", () => {
        assert.throws(
            () => validateLocationInput({ orderId: "1", latitude: 31.0, longitude: 75.0, timestamp: Date.now(), sequence: -5 }),
            (err) => err instanceof ApiError && err.statusCode === 400 && err.message.includes("Sequence")
        );
        assert.throws(
            () => validateLocationInput({ orderId: "1", latitude: 31.0, longitude: 75.0, timestamp: Date.now(), sequence: 1.5 }),
            (err) => err instanceof ApiError && err.statusCode === 400
        );
    });

    await t.test("rejects future or stale timestamp", () => {
        // Far future timestamp (+60 seconds)
        assert.throws(
            () => validateLocationInput({ orderId: "1", latitude: 31.0, longitude: 75.0, timestamp: Date.now() + 60000, sequence: 1 }),
            (err) => err instanceof ApiError && err.statusCode === 400 && err.message.includes("future")
        );
        // Stale timestamp (> 5 minutes ago)
        assert.throws(
            () => validateLocationInput({ orderId: "1", latitude: 31.0, longitude: 75.0, timestamp: Date.now() - 400000, sequence: 1 }),
            (err) => err instanceof ApiError && err.statusCode === 400 && err.message.includes("stale")
        );
    });
});

test("Movement Plausibility - validateMovementPlausibility", async (t) => {
    const baseTime = Date.now();

    await t.test("passes when no previous location exists", () => {
        const result = validateMovementPlausibility({
            previousLocation: null,
            newLocation: { sequence: 1, timestamp: baseTime, latitude: 31.326, longitude: 75.576 }
        });
        assert.equal(result, true);
    });

    await t.test("passes for plausible movement (e.g. 100m in 10s = 10 m/s = 36 km/h)", () => {
        const prev = { sequence: 1, timestamp: baseTime - 10000, latitude: 31.3260, longitude: 75.5760 };
        const next = { sequence: 2, timestamp: baseTime, latitude: 31.3268, longitude: 75.5765 };

        const result = validateMovementPlausibility({ previousLocation: prev, newLocation: next });
        assert.equal(result, true);
    });

    await t.test("rejects out-of-order sequence and timestamp", () => {
        const prev = { sequence: 5, timestamp: baseTime, latitude: 31.3260, longitude: 75.5760 };
        const next = { sequence: 4, timestamp: baseTime - 5000, latitude: 31.3262, longitude: 75.5762 };

        assert.throws(
            () => validateMovementPlausibility({ previousLocation: prev, newLocation: next }),
            (err) => err instanceof ApiError && err.statusCode === 400 && err.message.includes("Stale or out-of-order")
        );
    });

    await t.test("rejects unrealistic jumps (e.g. 50 km in 10 seconds)", () => {
        const prev = { sequence: 1, timestamp: baseTime - 10000, latitude: 31.3260, longitude: 75.5760 };
        // 50 km away
        const next = { sequence: 2, timestamp: baseTime, latitude: 31.7500, longitude: 75.9500 };

        assert.throws(
            () => validateMovementPlausibility({ previousLocation: prev, newLocation: next }),
            (err) => err instanceof ApiError && err.statusCode === 400 && err.message.includes("Unrealistic GPS coordinate jump")
        );
    });
});

test("Haversine Distance calculation", () => {
    // 0 distance between identical coordinates
    const dZero = haversineDistanceMeters(31.326, 75.5762, 31.326, 75.5762);
    assert.equal(Math.round(dZero), 0);

    // Approximate distance between Delhi (28.6139, 77.2090) and Mumbai (19.0760, 72.8777) ~ 1148 km
    const dDelhiMumbai = haversineDistanceMeters(28.6139, 77.209, 19.076, 72.8777);
    assert.ok(dDelhiMumbai > 1140000 && dDelhiMumbai < 1160000);
});

test("Kafka Tracking Event - createLocationEvent", () => {
    const event = createLocationEvent({
        riderId: "rider-1",
        orderId: "order-1",
        deliveryId: "del-1",
        cityId: "jalandhar",
        latitude: 31.326,
        longitude: 75.5762,
        accuracy: 5.0,
        speed: 25.0,
        heading: 90,
        sequence: 1,
        timestamp: 1700000000000
    });

    assert.ok(event.eventId, "Event ID should be generated");
    assert.equal(event.eventType, "rider.location_updated");
    assert.equal(event.data.riderId, "rider-1");
    assert.equal(event.data.orderId, "order-1");
    assert.equal(event.data.latitude, 31.326);
    assert.equal(event.data.longitude, 75.5762);
});

test("Tracking Rate Limiter", () => {
    const rateLimiter = createTrackingRateLimiter({ minIntervalMs: 1000 });
    const req = { user: { riderId: "rider-rate-test-1" } };
    const res = {};
    let nextCalled = false;
    const next = (err) => {
        if (err) throw err;
        nextCalled = true;
    };

    // First request should pass
    rateLimiter(req, res, next);
    assert.equal(nextCalled, true);

    // Immediate second request should be blocked
    assert.throws(
        () => rateLimiter(req, res, next),
        (err) => err instanceof ApiError && err.statusCode === 429 && err.message.includes("Rate limit exceeded")
    );
});

test("Location History Consumer - buildBulkInsertQuery", () => {
    const records = [
        {
            eventId: "evt-1",
            riderId: "rider-1",
            orderId: "order-1",
            latitude: 31.326,
            longitude: 75.5762,
            accuracy: 5.0,
            speed: 20.0,
            heading: 100,
            sequence: 1,
            recordedAt: new Date(1700000000000)
        },
        {
            eventId: "evt-2",
            riderId: "rider-1",
            orderId: "order-1",
            latitude: 31.327,
            longitude: 75.577,
            accuracy: 4.5,
            speed: 22.0,
            heading: 105,
            sequence: 2,
            recordedAt: new Date(1700000010000)
        }
    ];

    const { query, values } = buildBulkInsertQuery(records);

    assert.ok(query.includes("INSERT INTO rider_location_history"), "Query should insert into rider_location_history");
    assert.ok(query.includes("ON CONFLICT (event_id) DO NOTHING"), "Query should handle conflicts idempotently");
    assert.ok(query.includes("($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)"), "First placeholder group");
    assert.ok(query.includes("($11, $12, $13, $14, $15, $16, $17, $18, $19, $20)"), "Second placeholder group");
    assert.equal(values.length, 20);
    assert.equal(values[0], "evt-1");
    assert.equal(values[10], "evt-2");
});
