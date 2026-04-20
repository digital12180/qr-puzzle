import { redisClient } from './redis.js';

// ✅ Clear all claims cache
export const clearClaimsCache = async () => {
    try {
        let cursor: string = '0';  // ✅ FIX

        do {
            const result = await redisClient.scan(cursor, {
                MATCH: 'claims:*',
                COUNT: 100
            });

            cursor = result.cursor;  // ✅ string रहेगा
            const keys = result.keys;

            if (keys.length > 0) {
                await redisClient.del(keys);
            }

        } while (cursor !== '0');  // ✅ string comparison

        console.log('🧹 Claims cache cleared');

    } catch (error) {
        console.error('Cache clear error:', error);
    }
};

export const clearPuzzleCache = async () => {
    try {
        let cursor = '0';

        do {
            const result = await redisClient.scan(cursor, {
                MATCH: 'puzzles:*',
                COUNT: 100
            });

            cursor = result.cursor;
            const keys=result.keys;

            if (result.keys.length > 0) {
                await redisClient.del(keys);
            }

        } while (cursor !== '0');

        console.log('🧹 Puzzle cache cleared');

    } catch (error) {
        console.error('Puzzle cache clear error:', error);
    }
};

export const clearRewardsCache = async () => {
    try {
        let cursor: string = '0';

        do {
            const result = await redisClient.scan(cursor, {
                MATCH: 'rewards:*',
                COUNT: 100
            });

            cursor = result.cursor;
            const keys=result.keys;

            if (result.keys.length > 0) {
                await redisClient.del(keys);
            }

        } while (cursor !== '0');

        console.log('🧹 Rewards cache cleared');

    } catch (error) {
        console.error('Rewards cache clear error:', error);
    }
};

export const clearUserRewardsCache = async (email: string) => {
    try {
        const key = `user-rewards:${email}`;
        await redisClient.del(key);

        console.log(`🧹 Cleared cache for user: ${email}`);
    } catch (error) {
        console.error('User rewards cache clear error:', error);
    }
};
