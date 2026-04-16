import type { Request, Response, NextFunction } from 'express';
import { ValidationService } from '../../../services/validation.service.js';
import { APIResponse } from '../../../utils/apiResponse.js';
import { User } from '../../../models/user.model.js';
import { Reward } from '../../../models/Reward.model.js';
import { Puzzle } from '../../../models/Puzzle.model.js';
import { Claim } from '../../../models/Claim.model.js';

export class UserScanController {
    static async scanQRCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { qr_text } = req.body;
            // if (!qr_text) {
            //     return res.json(new APIResponse(false, "qr_text fields are required!"))
            // }

            const validation = await ValidationService.validateQRCode(qr_text);

            if (!validation.valid) {
                return res.status(400).json({
                    valid: false,
                    message: validation.message
                });
            }

            res.json({
                valid: true,
                puzzle_id: validation.puzzle?.puzzle_id,
                message: 'QR code valid. Proceed to claim reward.'
            });
        } catch (error) {
            // res.status(500).json({ message: 'Scan failed', error });
            next(error)
        }
    }

    static async validateScannedPuzzle(req: Request, res: Response, next: NextFunction) {
        try {
            const { puzzle_id } = req.params;

            const validation = await ValidationService.validateQRCode(puzzle_id as string);

            res.json(validation);
        } catch (error) {
            // res.status(500).json({ message: 'Validation failed', error });
            next(error)
        }
    }

    static async submitUsrDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, puzzle_id } = req.body;

            // Validation
            if (!name || !email || !puzzle_id) {
                return res.status(400).json(new APIResponse(false, "Name, email and puzzle_id are required!"));
            }

            // Find puzzle
            const puzzle = await Puzzle.findOne({ puzzle_id: puzzle_id });
            if (!puzzle) {
                return res.status(404).json(new APIResponse(false, "Invalid puzzle!"));
            }

            // Find reward for this puzzle
            const reward = await Reward.findOne({ puzzle_id: puzzle_id });
            if (!reward) {
                return res.status(404).json(new APIResponse(false, "Reward not found for this puzzle!"));
            }

            // Check if reward is expired
            if (puzzle.expires_at < new Date()) {
                return res.status(400).json(new APIResponse(false, "Reward has expired!"));
            }

            // Check if reward is active
            if (!reward.is_active) {
                return res.status(400).json(new APIResponse(false, "Reward is no longer active!"));
            }

            // // Check if already claimed
            // const existingClaim = await Claim.findOne({ puzzle_id: puzzle_id });
            // if (existingClaim) {
            //     return res.status(409).json(new APIResponse(false, "Reward already claimed!"));
            // }

            // Find or create user
            let user = await User.findOne({ email: email });

            if (user) {
                // Update name if changed
                if (name !== user.name) {
                    user.name = name;
                }
                // Add reward if not already present
                if (!user.rewards.includes(reward.reward_id)) {
                    user.rewards.push(reward.reward_id);
                }
                await user.save();
            } else {
                user = await User.create({
                    email: email,
                    name: name,
                    rewards: [reward.reward_id]
                });
            }

            // // Create claim record
            // const claim = await Claim.create({
            //     claim_id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            //     puzzle_id: puzzle_id,
            //     user_device_id: email,
            //     redemption_status: 'completed'
            // });

            // // Update puzzle status
            // await Puzzle.findOneAndUpdate(
            //     { puzzle_id: puzzle_id },
            //     { status: 'solved' }
            // );

            return res.status(200).json(new APIResponse(true, "Reward claimed successfully!", {
                user: {
                    name: user.name,
                    email: user.email
                },
                reward: {
                    reward_type: reward.reward_type,
                    reward_value: reward.reward_value,
                    terms: reward.terms
                }
            }));
        } catch (error) {
            next(error);
        }
    }

    static async getUserRewards(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.params;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: "Email is required"
                });
            }

            const user = await User.findOne({ email }).select('email rewards');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // ✅ Fetch reward details using reward_id array
            const rewardsData = await Reward.find({
                reward_id: { $in: user.rewards }
            }).select('-__v');

            // ✅ Maintain same order as stored in user.rewards
            const rewardMap = new Map(
                rewardsData.map(r => [r.reward_id, r])
            );

            const orderedRewards = user.rewards.map(id => rewardMap.get(id));

            return res.status(200).json({
                success: true,
                email: user.email,
                total_rewards: orderedRewards.length,
                rewards: orderedRewards
            });

        } catch (error) {
            next(error);
        }
    }

}