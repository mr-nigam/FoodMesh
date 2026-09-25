import {
    getCache,
    geoSearch,
    deleteOrderRelatedCache
} from '@foodmesh/redis';

import {
    ApiError,
    verifyCoordinates
} from '@foodmesh/utils';

import {
    emitRealtimeEvent
} from '../clients/realtime.js';

import { 
    getOrderData
} from '../clients/order.js';

import {
    getNearbyRiders
} from '../clients/rider.js';

import {
    getDeliveryRepo,
    getDeliveryByIdRepo,
    batchCreateDeliveryOffersRepo,
    expireDeliveryOffersRepo,
    updateDeliveryOverallStatusRepo
} from '../repositories/internal.js';

import {
    createDeliveryService
} from './createDeliveryService.js';


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const BATCH_SIZE = 5;
const WINDOW_SECONDS = 15;
const MAX_TOTAL_RIDERS = 40; // Up to 8 batches of 5 riders (30-40 riders)


const appointRiderService = async ({
    orderId,
    restaurantOrderId,
    customerUserId,
    restaurantId
}) => {

    console.log(`[AppointRider] Starting rider dispatch for orderId=${orderId}, restaurantOrderId=${restaurantOrderId}`);

    const deliveryCacheKey = `delivery:order:${orderId}:restaurantOrder:${restaurantOrderId}`;

    let delivery = await getCache({
        key: deliveryCacheKey
    });

    if(!delivery){
        delivery = await getDeliveryRepo({
            orderId,
            restaurantOrderId
        });

        if(!delivery){
            console.log(`[AppointRider] Delivery record missing in DB. Fetching order data to create...`);

            const order = await getOrderData({
                orderId,
                restaurantOrderId
            });

            if(!order){
                throw new ApiError(
                    500,
                    "Failed to fetch order data to create delivery"
                );
            }

            delivery = await createDeliveryService({
                order
            });
        }
    }

    if(
        !delivery || 
        !delivery.delivery_id
    ){
        throw new ApiError(
            500,
            "Could not resolve valid delivery record"
        );
    }

    if(delivery?.rider_id){
        console.log(`[AppointRider] Delivery ${delivery.delivery_id} is already assigned to rider ${delivery.rider_id}. Skipping.`);

        return {
            assigned: true,
            riderId: delivery.rider_id,
            deliveryId: delivery.delivery_id
        };
    }

    // Set delivery status to searching_rider
    await updateDeliveryOverallStatusRepo({
        deliveryId: delivery.delivery_id,
        status: 'searching_rider'
    });

    const pickupLongitude = Number(delivery.pickup_longitude);
    const pickupLatitude = Number(delivery.pickup_latitude);

    const isValid = verifyCoordinates({
        longitude: pickupLongitude,
        latitude: pickupLatitude
    });

    if(!isValid){
        throw new ApiError(
            400,
            "Invalid pickup coordinates on delivery record"
        );
    }

    console.log(`[AppointRider] Pickup Coords: lon=${pickupLongitude}, lat=${pickupLatitude}`);

    // ==========================================
    // STEP 1: Fetch candidate riders from Redis
    // ==========================================
    const riderSearchCacheKey = 'riders:active';
    let candidateRiders = [];
    const seenRiderIds = new Set();

    try{
        const redisResults = await geoSearch({
            key: riderSearchCacheKey,
            longitude: pickupLongitude,
            latitude: pickupLatitude,
            radius: 5000 // 5km radius
        });

        // redis.geosearch WITHDIST returns array of [ [member, dist], ... ]
        if(Array.isArray(redisResults) && redisResults.length > 0){

            for(const item of redisResults){
                const[riderUserId, riderId] = item.split(':');

                if(riderId && !seenRiderIds.has(String(riderId))){
                    seenRiderIds.add(String(riderId));
                    candidateRiders.push({
                        riderUserId: riderUserId,
                        riderId: riderId
                    });
                }
            }

        }

    }catch(redisErr){
        console.warn(`[AppointRider] Redis geoSearch encountered an issue:`, redisErr.message);
    }

    console.log(`[AppointRider] Found ${candidateRiders.length} candidates from Redis.`);

    // ========================================================
    // STEP 2: DB Fallback / Complement to reach 30-40 riders
    // ========================================================
    if(candidateRiders.length < MAX_TOTAL_RIDERS){
        const remainingNeeded = MAX_TOTAL_RIDERS - candidateRiders.length;

        console.log(`[AppointRider] Querying Rider Service DB fallback for ${remainingNeeded} more candidates...`);

        try {
            const dbRiders = await getNearbyRiders({
                longitude: pickupLongitude,
                latitude: pickupLatitude,
                radius: 12000,
                limit: remainingNeeded
            });

            if (Array.isArray(dbRiders)){
                for (const r of dbRiders){
                    const idStr = String(r.id || r.rider_id);
                    
                    if(idStr && !seenRiderIds.has(idStr) && r.user_id){
                        seenRiderIds.add(idStr);
                        candidateRiders.push({
                            riderUserId: r.user_id,
                            riderId: r.rider_id
                        });
                    }
                }
            }

        }catch(dbErr){
            console.warn(`[AppointRider] DB fallback failed:`, dbErr.message);
        }
    }

    console.log(`[AppointRider] Total unique candidates assembled: ${candidateRiders.length}`);

    if(candidateRiders.length === 0){
        console.log(`[AppointRider] No active online riders found within range for delivery ${delivery.delivery_id}.`);
        return {
            assigned: false,
            message: "No riders available"
        };
    }

    // ========================================================
    // STEP 3: Dispatch in 5-by-5 Batches with 15-second Window
    // ========================================================
    const batches = [];

    for(let i = 0; i < candidateRiders.length; i += BATCH_SIZE){
        batches.push(candidateRiders.slice(i, i + BATCH_SIZE));
    }

    console.log(`[AppointRider] Split ${candidateRiders.length} riders into ${batches.length} batches of up to ${BATCH_SIZE}.`);

    const deliveryAssignedKey = `delivery:${delivery.delivery_id}:assigned_rider`;

    for(let batchIndex = 0; batchIndex < batches.length; batchIndex++){
        const currentBatch = batches[batchIndex];
        console.log(`[AppointRider] === Dispatching Batch #${batchIndex + 1} (${currentBatch.length} riders) for Delivery ${delivery.delivery_id} ===`);

        // Check if already assigned
        const alreadyAssignedRider = await getCache({
            key: deliveryAssignedKey 
        });
        
        if(alreadyAssignedRider){
            console.log(`[AppointRider] Delivery already accepted by rider ${alreadyAssignedRider}. Terminating dispatch.`);
            return { 
                assigned: true,
                riderId: alreadyAssignedRider
            };
        }

        const expiresAt = new Date(Date.now() + WINDOW_SECONDS * 1000);
        const riderIds = currentBatch.map(r => r.riderId);

        const createdOffers = await batchCreateDeliveryOffersRepo({
            deliveryId: delivery.delivery_id,
            riderIds,
            expiresAt
        });

        const offerMapByRiderId = new Map();
        for(const offer of createdOffers){
            offerMapByRiderId.set(String(offer.rider_id), offer);
        }

        // Send real-time request to each rider in the batch
        const safeParseAddress = (address) => {
            if (!address) return {};
            if (typeof address === 'object') return address;
            if (typeof address === 'string') {
                try {
                    const parsed = JSON.parse(address);
                    if (typeof parsed === 'object' && parsed !== null) {
                        return parsed;
                    }
                    return { formattedAddress: String(parsed), addressLine1: String(parsed) };
                } catch {
                    return { formattedAddress: address, addressLine1: address };
                }
            }
            return {};
        };

        const restaurantAddress = safeParseAddress(delivery.restaurant_address);
        const deliveryAddress = safeParseAddress(delivery.delivery_address);

        for(const rider of currentBatch){
            const {
                riderId,
                riderUserId
            } = rider;

            const offer = offerMapByRiderId.get(String(riderId));
            if(!offer) continue;

            const offerPayload = {
                offerId: offer.offer_id,
                deliveryId: delivery.delivery_id,
                orderId: delivery.order_id,
                restaurantOrderId: delivery.restaurant_order_id,
                restaurantName: delivery.restaurant_name,
                restaurantAddress,
                recipientName: delivery.recipient_name,
                recipientPhone: delivery.recipient_phone,
                deliveryAddress,
                pickupCoords: {
                    longitude: pickupLongitude,
                    latitude: pickupLatitude
                },
                dropCoords: {
                    longitude: Number(delivery.drop_longitude),
                    latitude: Number(delivery.drop_latitude)
                },
                estimatedDistanceMeters: delivery.estimated_distance_meters || 0,
                estimatedDurationSeconds: delivery.estimated_duration_seconds || 0,
                estimatedEarnings: 65.0,
                expiresAt: expiresAt.toISOString(),
                windowSeconds: WINDOW_SECONDS
            };

            await emitRealtimeEvent({
                event: "delivery:offer:new",
                room: `user:${riderUserId}`,
                payload: offerPayload
            });

            console.log(`[AppointRider] Sent delivery:offer:new to rider ${riderId} offerId=${offer.offer_id}`);
        }

        // Wait up to 15 seconds, polling every 1 second for acceptance
        let batchAccepted = false;
        let winningRiderId = null;

        for(let second = 0; second < WINDOW_SECONDS; second++){
            await sleep(1000);

            const assignedRider = await getCache({
                key: deliveryAssignedKey
            });
            
            if(assignedRider){
                batchAccepted = true;
                winningRiderId = assignedRider;
                break;
            }

            const checkDelivery = await getDeliveryByIdRepo({
                deliveryId: delivery.delivery_id
            });
            
            if(checkDelivery?.rider_id){
                batchAccepted = true;
                winningRiderId = checkDelivery.rider_id;
                break;
            }
        }

        if(batchAccepted){
            console.log(`🎉 [AppointRider] Delivery ${delivery.delivery_id} was ACCEPTED by rider ${winningRiderId} during batch #${batchIndex + 1}!`);
            
            // redis cache cleanup for user, restaurant and rider
            await deleteOrderRelatedCache({
                orderId,
                restaurantId,
                userId: customerUserId,
                restaurantOrderId,
                riderId: winningRiderId,
                deliveryId: delivery.delivery_id
            });
            
            return {
                assigned: true,
                riderId: winningRiderId,
                deliveryId: delivery.delivery_id
            };
        }

        // 15 seconds elapsed without acceptance: expire this batch of offers
        console.log(`⏰ [AppointRider] 15s window expired for Batch #${batchIndex + 1}. Marking offers expired.`);
        const offerIdsToExpire = createdOffers.map(o => o.id);
        await expireDeliveryOffersRepo({
            offerIds: offerIdsToExpire 
        });

        // Notify the 4 riders that offer has expired
        for(const rider of currentBatch){
            const {
                riderId,
                riderUserId
            } = rider;
            
            const offer = offerMapByRiderId.get(String(riderId));
            if (offer) {
                emitRealtimeEvent({
                    event: "delivery:offer:expired",
                    room: `user:${riderUserId}`,
                    payload: {
                        offerId: offer.offer_id,
                        deliveryId: delivery.delivery_id
                    }
                }).catch(() => {});
            }
        }
    }

    console.log(`[AppointRider] Exhausted all ${batches.length} batches. No rider accepted delivery ${delivery.delivery_id}.`);
    return {
        assigned: false,
        message: "All batches exhausted without acceptance"
    };
};


export {
    appointRiderService
};