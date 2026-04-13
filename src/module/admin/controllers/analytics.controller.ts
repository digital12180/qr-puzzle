import type { Request, Response } from 'express';
import { Puzzle } from '../../../models/Puzzle.model.js';
import { Claim } from '../../../models/Claim.model.js';
import { Reward } from '../../../models/Reward.model.js';

export class AdminAnalyticsController {
    static async getAnalytics(req: Request, res: Response) {
        try {
            const totalPuzzles = await Puzzle.countDocuments();
            const totalClaims = await Claim.countDocuments();
            const activeRewards = await Reward.countDocuments({ is_active: true });

            const claimsByRewardType = await Reward.aggregate([
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
                        count: { $sum: { $size: '$claims' } }
                    }
                }
            ]);

            res.json({
                total_puzzles: totalPuzzles,
                total_claims: totalClaims,
                active_rewards: activeRewards,
                claim_rate: totalPuzzles > 0 ? (totalClaims / totalPuzzles * 100).toFixed(2) : 0,
                claims_by_reward_type: claimsByRewardType
            });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch analytics', error });
        }
    }
}