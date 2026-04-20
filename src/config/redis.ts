import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

export const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 3) {
                console.log('❌ Redis retry limit reached, skipping...');
                return new Error('Retry limit reached');
            }
            return 1000; // retry after 1 sec
        }
    }
});

redisClient.on('error', (err) => {
    console.error('❌ Redis Error:', err.message);
});

redisClient.on('connect', () => {
    console.log('🔄 Connecting to Redis...');
});

redisClient.on('ready', () => {
    console.log('✅ Redis ready');
});

export const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (error) {
        console.error('❌ Redis connection failed, continuing without Redis');
    }
};