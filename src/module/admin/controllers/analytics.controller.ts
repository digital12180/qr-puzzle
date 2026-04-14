// import type { Request, Response ,NextFunction } from 'express';
// import { Puzzle } from '../../../models/Puzzle.model.js';
// import { Claim } from '../../../models/Claim.model.js';
// import { Reward } from '../../../models/Reward.model.js';

// export class AdminAnalyticsController {
//     static async getAnalytics(req: Request, res: Response, next: NextFunction) {
//         try {
//             const totalPuzzles = await Puzzle.countDocuments();
//             const totalClaims = await Claim.countDocuments();
//             const activeRewards = await Reward.countDocuments({ is_active: true });

//             const claimsByRewardType = await Reward.aggregate([
//                 {
//                     $lookup: {
//                         from: 'claims',
//                         localField: 'puzzle_id',
//                         foreignField: 'puzzle_id',
//                         as: 'claims'
//                     }
//                 },
//                 {
//                     $group: {
//                         _id: '$reward_type',
//                         count: { $sum: { $size: '$claims' } }
//                     }
//                 }
//             ]);

//             res.json({
//                 total_puzzles: totalPuzzles,
//                 total_claims: totalClaims,
//                 active_rewards: activeRewards,
//                 claim_rate: totalPuzzles > 0 ? (totalClaims / totalPuzzles * 100).toFixed(2) : 0,
//                 claims_by_reward_type: claimsByRewardType
//             });
//         } catch (error) {
//             // res.status(500).json({ message: 'Failed to fetch analytics', error });
//             next(error)
//         }
//     }
// }
// src/controllers/admin/analytics.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { Puzzle } from '../../../models/Puzzle.model.js';
import { Claim } from '../../../models/Claim.model.js';
import { Reward } from '../../../models/Reward.model.js';

export class AdminAnalyticsController {
    static async getAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            // Date range filters
            const { from_date, to_date, period } = req.query;

            let dateFilter: any = {};
            let claimDateFilter: any = {};

            // Apply date filters
            if (from_date || to_date) {
                if (from_date) {
                    dateFilter.created_at = { $gte: new Date(from_date as string) };
                    claimDateFilter.claimed_at = { $gte: new Date(from_date as string) };
                }
                if (to_date) {
                    dateFilter.created_at = { ...dateFilter.created_at, $lte: new Date(to_date as string) };
                    claimDateFilter.claimed_at = { ...claimDateFilter.claimed_at, $lte: new Date(to_date as string) };
                }
            }

            // Period presets
            if (period) {
                const now = new Date();
                let startDate: Date;

                switch (period) {
                    case 'today':
                        startDate = new Date(now.setHours(0, 0, 0, 0));
                        break;
                    case 'yesterday':
                        startDate = new Date(now.setDate(now.getDate() - 1));
                        startDate.setHours(0, 0, 0, 0);
                        break;
                    case 'week':
                        startDate = new Date(now.setDate(now.getDate() - 7));
                        break;
                    case 'month':
                        startDate = new Date(now.setMonth(now.getMonth() - 1));
                        break;
                    case 'year':
                        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                        break;
                    default:
                        startDate = new Date(0);
                }

                dateFilter.created_at = { $gte: startDate };
                claimDateFilter.claimed_at = { $gte: startDate };
            }

            // Execute all queries in parallel for better performance
            const [
                totalPuzzles,
                totalClaims,
                activeRewards,
                puzzlesByStatus,
                claimsByRewardType,
                claimsByStatus,
                dailyClaims,
                topRewards,
                puzzleCompletionRate,
                expiredPuzzles
            ] = await Promise.all([
                // Total puzzles with date filter
                Puzzle.countDocuments(dateFilter),

                // Total claims with date filter
                Claim.countDocuments(claimDateFilter),

                // Active rewards
                Reward.countDocuments({ is_active: true }),

                // Puzzles grouped by status
                Puzzle.aggregate([
                    { $match: dateFilter },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ]),

                // Claims grouped by reward type
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
                        $match: {
                            'claims.claimed_at': claimDateFilter.claimed_at || { $exists: true }
                        }
                    },
                    {
                        $group: {
                            _id: '$reward_type',
                            count: { $sum: { $size: '$claims' } }
                        }
                    }
                ]),

                // Claims grouped by redemption status
                Claim.aggregate([
                    { $match: claimDateFilter },
                    {
                        $group: {
                            _id: '$redemption_status',
                            count: { $sum: 1 }
                        }
                    }
                ]),

                // Daily claims for chart (last 7 days)
                Claim.aggregate([
                    {
                        $match: {
                            claimed_at: {
                                $gte: new Date(new Date().setDate(new Date().getDate() - 7))
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: { format: '%Y-%m-%d', date: '$claimed_at' }
                            },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]),

                // Top 5 most claimed rewards
                Claim.aggregate([
                    { $match: claimDateFilter },
                    {
                        $lookup: {
                            from: 'rewards',
                            localField: 'puzzle_id',
                            foreignField: 'puzzle_id',
                            as: 'reward'
                        }
                    },
                    { $unwind: '$reward' },
                    {
                        $group: {
                            _id: '$reward.reward_value',
                            reward_type: { $first: '$reward.reward_type' },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: 5 }
                ]),

                // Puzzle completion rate (solved vs total)
                Puzzle.aggregate([
                    { $match: dateFilter },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            solved: {
                                $sum: {
                                    $cond: [{ $eq: ['$status', 'solved'] }, 1, 0]
                                }
                            }
                        }
                    }
                ]),

                // Expired puzzles
                Puzzle.countDocuments({
                    ...dateFilter,
                    expires_at: { $lt: new Date() },
                    status: { $ne: 'expired' }
                })
            ]);

            // Calculate claim rate
            const claimRate = totalPuzzles > 0
                ? ((totalClaims / totalPuzzles) * 100).toFixed(2)
                : '0';

            // Calculate conversion metrics
            const solvedPuzzles = puzzlesByStatus.find(s => s._id === 'solved')?.count || 0;
            const deliveredPuzzles = puzzlesByStatus.find(s => s._id === 'delivered')?.count || 0;
            const pendingPuzzles = puzzlesByStatus.find(s => s._id === 'pending')?.count || 0;

            const completionRate = totalPuzzles > 0
                ? ((solvedPuzzles / totalPuzzles) * 100).toFixed(2)
                : '0';

            // Format daily claims for chart
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const claimData = dailyClaims.find(c => c._id === dateStr);
                last7Days.push({
                    date: dateStr,
                    claims: claimData ? claimData.count : 0
                });
            }

            res.json({
                success: true,
                period: {
                    from: from_date || (period ? new Date(dateFilter.created_at?.$gte).toISOString() : null),
                    to: to_date || null,
                    filter_type: period || 'custom'
                },
                summary: {
                    total_puzzles: totalPuzzles,
                    total_claims: totalClaims,
                    active_rewards: activeRewards,
                    expired_puzzles: expiredPuzzles,
                    claim_rate: `${claimRate}%`,
                    completion_rate: `${completionRate}%`
                },
                puzzle_status_breakdown: {
                    solved: solvedPuzzles,
                    delivered: deliveredPuzzles,
                    pending: pendingPuzzles,
                    expired: expiredPuzzles
                },
                claim_status_breakdown: claimsByStatus.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {} as Record<string, number>),
                claims_by_reward_type: claimsByRewardType.map(item => ({
                    reward_type: item._id,
                    count: item.count
                })),
                top_rewards: topRewards.map(item => ({
                    reward_value: item._id,
                    reward_type: item.reward_type,
                    times_claimed: item.count
                })),
                daily_trend: last7Days,
                conversion: {
                    puzzles_delivered: deliveredPuzzles,
                    puzzles_solved: solvedPuzzles,
                    rewards_claimed: totalClaims,
                    dropoff_rate: totalPuzzles > 0
                        ? `${(((totalPuzzles - totalClaims) / totalPuzzles) * 100).toFixed(2)}%`
                        : '0%'
                }
            });
        } catch (error) {
            next(error);
        }
    }
}