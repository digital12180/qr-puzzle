import type { Request, Response, NextFunction } from 'express';
import { Reward } from '../../../models/Reward.model.js';
import { Puzzle } from '../../../models/Puzzle.model.js';
import { Claim } from '../../../models/Claim.model.js';



export class UserRewardController {
    static async getRewardDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { puzzle_id } = req.params;
          
            // Validate puzzle_id parameter
            if (!puzzle_id || puzzle_id.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid puzzle ID provided'
                });
            }

            // Fetch puzzle and reward in parallel for better performance
            const [puzzle, reward, existingClaim] = await Promise.all([
                Puzzle.findOne({ puzzle_id: puzzle_id }),
                Reward.findOne({ puzzle_id: puzzle_id }),
                Claim.findOne({ puzzle_id: puzzle_id })
            ]);

            // Check if puzzle exists
            if (!puzzle) {
                return res.status(404).json({
                    success: false,
                    message: 'Puzzle not found. Please check the QR code and try again.'
                });
            }

            // Check if reward exists
            if (!reward) {
                return res.status(404).json({
                    success: false,
                    message: 'Reward not configured for this puzzle. Please contact support.'
                });
            }

            // Check if reward is active
            if (!reward.is_active) {
                return res.status(400).json({
                    success: false,
                    message: 'This reward is no longer available. It has been deactivated.'
                });
            }

            // Check if puzzle is expired
            const currentDate = new Date();
            if (puzzle.expires_at < currentDate) {
                return res.status(400).json({
                    success: false,
                    message: `This reward offer has expired on ${puzzle.expires_at.toLocaleDateString()}.`
                });
            }

            // Check if reward is already claimed
            if (existingClaim) {
                return res.status(409).json({
                    success: false,
                    message: 'This reward has already been claimed.',
                    claimed_at: existingClaim.claimed_at,
                    claim_status: existingClaim.redemption_status
                });
            }

            // Calculate remaining days before expiry
            const remainingDays = Math.ceil(
                (puzzle.expires_at.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
            );


            // Format response
            res.json({
                success: true,
                data: {
                    reward: {
                        reward_id: reward.reward_id,
                        reward_type: reward.reward_type,
                        reward_value: reward.reward_value,
                        terms: reward.terms,
                        is_active: reward.is_active
                    },
                    puzzle: {
                        puzzle_id: puzzle.puzzle_id,
                        status: puzzle.status,
                        expires_at: puzzle.expires_at,
                        remaining_days: remainingDays,
                        split_pieces_count: puzzle.split_pieces_count
                    },
                    claim_info: {
                        is_claimed: false,
                        status: 'available',
                        message: 'Reward is available. You can proceed to claim it.'
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }
}