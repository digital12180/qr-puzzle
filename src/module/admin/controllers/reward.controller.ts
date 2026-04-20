// src/controllers/admin/reward.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { Reward } from '../../../models/Reward.model.js';
import { Puzzle } from '../../../models/Puzzle.model.js';
import { Claim } from '../../../models/Claim.model.js';
// import { redisClient } from '../../../config/redis.js';
// import { clearClaimsCache, clearPuzzleCache, clearRewardsCache } from '../../../config/cache.js';

export class AdminRewardController {
    static async getAllRewards(req: Request, res: Response, next: NextFunction) {
        try {
            // Pagination params
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            // Filter params
            const {
                reward_type,
                is_active,
                from_date,
                to_date,
                search,
                min_claims,
                max_claims
            } = req.query;
//             const cacheKey = `rewards:
// ${reward_type || 'all'}:
// ${is_active !== undefined ? is_active : 'all'}:
// ${from_date || 'none'}:
// ${to_date || 'none'}:
// ${search || 'none'}:
// ${min_claims || 'none'}:
// ${max_claims || 'none'}
// `;

//             const cacheData = await redisClient.get(cacheKey);
//             if (cacheData) {
//                 console.log('cache hit');
//                 return res.json(JSON.parse(cacheData))
//             }
            // Build filter object
            let filter: any = {};

            // Filter by reward type
            if (reward_type && ['food', 'voucher', 'merchandise', 'digital'].includes(reward_type as string)) {
                filter.reward_type = reward_type;
            }

            // Filter by active status
            if (is_active !== undefined) {
                filter.is_active = is_active === 'true';
            }

            // Filter by date range
            if (from_date || to_date) {
                filter.createdAt = {};
                if (from_date) {
                    filter.createdAt.$gte = new Date(from_date as string);
                }
                if (to_date) {
                    filter.createdAt.$lte = new Date(to_date as string);
                }
            }

            // Search by reward value or terms
            if (search) {
                filter.$or = [
                    { reward_value: { $regex: search, $options: 'i' } },
                    { terms: { $regex: search, $options: 'i' } },
                    { reward_id: { $regex: search, $options: 'i' } }
                ];
            }

            // First get ALL rewards matching filters (without pagination)
            const allRewards = await Reward.find(filter).sort({ createdAt: -1 });

            // Enrich rewards with puzzle and claim statistics
            const rewardsWithStats = await Promise.all(
                allRewards.map(async (reward) => {
                    const puzzle = await Puzzle.findOne({ puzzle_id: reward.puzzle_id });
                    const claimCount = await Claim.countDocuments({ puzzle_id: reward.puzzle_id });
                    const claims = await Claim.find({ puzzle_id: reward.puzzle_id })
                        .sort({ claimed_at: -1 })
                        .limit(5);

                    return {
                        reward_id: reward.reward_id,
                        puzzle_id: reward.puzzle_id,
                        reward_type: reward.reward_type,
                        reward_value: reward.reward_value,
                        terms: reward.terms,
                        is_active: reward.is_active,
                        created_at: reward.createdAt,
                        puzzle_details: puzzle ? {
                            status: puzzle.status,
                            split_pieces_count: puzzle.split_pieces_count,
                            expires_at: puzzle.expires_at,
                            qr_original_text: puzzle.qr_original_text
                        } : null,
                        statistics: {
                            total_claims: claimCount,
                            recent_claims: claims.map(claim => ({
                                claim_id: claim.claim_id,
                                claimed_at: claim.claimed_at,
                                redemption_status: claim.redemption_status,
                                user_device_id: claim.user_device_id
                            }))
                        }
                    };
                })
            );

            // Apply claim count filters (after enrichment)
            let filteredRewards = rewardsWithStats;
            if (min_claims || max_claims) {
                filteredRewards = rewardsWithStats.filter(reward => {
                    const claims = reward.statistics.total_claims;
                    if (min_claims && claims < parseInt(min_claims as string)) return false;
                    if (max_claims && claims > parseInt(max_claims as string)) return false;
                    return true;
                });
            }

            // ✅ FIX: Apply pagination AFTER all filtering
            const finalTotalCount = filteredRewards.length;
            const paginatedRewards = filteredRewards.slice(skip, skip + limit);

            const totalPages = Math.ceil(finalTotalCount / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            // Get summary statistics
            const [
                totalRewards,
                activeRewards,
                inactiveRewards,
                claimsByRewardType
            ] = await Promise.all([
                Reward.countDocuments(),
                Reward.countDocuments({ is_active: true }),
                Reward.countDocuments({ is_active: false }),
                Reward.aggregate([
                    {
                        $lookup: {
                            from: 'claims',
                            localField: 'puzzle_id',
                            foreignField: 'puzzle_id',
                            as: 'claims'
                        }
                    },
                    {
                        $group: {
                            _id: '$reward_type',
                            count: { $sum: { $size: '$claims' } },
                            reward_count: { $sum: 1 }
                        }
                    }
                ])
            ]);

            const response = {
                success: true,
                data: paginatedRewards,  // ✅ Fixed: using paginated data
                pagination: {
                    current_page: page,
                    limit: limit,
                    total_count: finalTotalCount,
                    total_pages: totalPages,
                    has_next_page: hasNextPage,
                    has_prev_page: hasPrevPage,
                    showing_from: skip + 1,
                    showing_to: Math.min(skip + limit, finalTotalCount)
                },
                filters: {
                    reward_type: reward_type || null,
                    is_active: is_active || null,
                    from_date: from_date || null,
                    to_date: to_date || null,
                    search: search || null,
                    min_claims: min_claims || null,
                    max_claims: max_claims || null
                },
                summary: {
                    total_rewards: totalRewards,
                    active_rewards: activeRewards,
                    inactive_rewards: inactiveRewards,
                    claims_by_reward_type: claimsByRewardType.map(item => ({
                        reward_type: item._id,
                        total_claims: item.count,
                        total_rewards: item.reward_count
                    }))
                }
            }
            // await redisClient.setEx(cacheKey, 60, JSON.stringify(response));
            return res.json(response)
        } catch (error) {
            next(error);
        }
    }

    static async getRewardById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const reward = await Reward.findOne({ reward_id: id });

            if (!reward) {
                return res.status(404).json({
                    success: false,
                    message: 'Reward not found'
                });
            }

            const puzzle = await Puzzle.findOne({ puzzle_id: reward.puzzle_id });
            const claims = await Claim.find({ puzzle_id: reward.puzzle_id })
                .sort({ claimed_at: -1 });

            res.json({
                success: true,
                data: {
                    reward: {
                        reward_id: reward.reward_id,
                        puzzle_id: reward.puzzle_id,
                        reward_type: reward.reward_type,
                        reward_value: reward.reward_value,
                        terms: reward.terms,
                        is_active: reward.is_active,
                        created_at: reward.createdAt
                    },
                    puzzle_details: puzzle,
                    claims: {
                        total: claims.length,
                        list: claims.map(claim => ({
                            claim_id: claim.claim_id,
                            user_device_id: claim.user_device_id,
                            claimed_at: claim.claimed_at,
                            redemption_status: claim.redemption_status
                        }))
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateReward(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { reward_type, reward_value, terms, is_active } = req.body;

            const reward = await Reward.findOneAndUpdate(
                { reward_id: id },
                { reward_type, reward_value, terms, is_active },
                { new: true, runValidators: true }
            );

            if (!reward) {
                return res.status(404).json({
                    success: false,
                    message: 'Reward not found'
                });
            }
            // await clearRewardsCache();
            // await clearPuzzleCache()
            res.json({
                success: true,
                message: 'Reward updated successfully',
                data: reward
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteReward(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const reward = await Reward.findOneAndDelete({ reward_id: id });

            if (!reward) {
                return res.status(404).json({
                    success: false,
                    message: 'Reward not found'
                });
            }
            // await clearRewardsCache();
            // await clearPuzzleCache()
            res.json({
                success: true,
                message: 'Reward deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    static async toggleRewardStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const reward = await Reward.findOne({ reward_id: id });

            if (!reward) {
                return res.status(404).json({
                    success: false,
                    message: 'Reward not found'
                });
            }

            reward.is_active = !reward.is_active;
            await reward.save();
            // await clearRewardsCache();
            // await clearPuzzleCache();
            res.json({
                success: true,
                message: `Reward ${reward.is_active ? 'activated' : 'deactivated'} successfully`,
                data: {
                    reward_id: reward.reward_id,
                    is_active: reward.is_active
                }
            });
        } catch (error) {
            next(error);
        }
    }
}