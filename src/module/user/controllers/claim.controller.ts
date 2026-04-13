import type{ Request, Response } from 'express';
import { Claim } from '../../../models/Claim.model.js';
import { Puzzle } from '../../../models/Puzzle.model.js';
import { Reward } from '../../../models/Reward.model.js';
import { ValidationService } from '../../../services/validation.service.js';
import { v4 as uuidv4 } from 'uuid';

export class UserClaimController {
    static async claimReward(req: Request, res: Response) {
        try {
            const { puzzle_id, user_device_id } = req.body;
            
            const puzzle = await Puzzle.findOne({ puzzle_id });
            if (!puzzle) {
                return res.status(404).json({ message: 'Puzzle not found' });
            }

            const validation = await ValidationService.validateQRCode(puzzle.qr_original_text);
            if (!validation.valid) {
                return res.status(400).json({ message: validation.message });
            }

            const claim = await Claim.create({
                claim_id: uuidv4(),
                puzzle_id: puzzle_id,
                user_device_id: user_device_id,
                redemption_status: 'completed'
            });

            await Puzzle.findOneAndUpdate(
                { puzzle_id },
                { status: 'solved' }
            );

            const reward = await Reward.findOne({ puzzle_id });

            res.json({
                success: true,
                claim_id: claim._id,
                reward: reward,
                message: 'Reward claimed successfully!'
            });
        } catch (error) {
            res.status(500).json({ message: 'Claim failed', error });
        }
    }

    static async checkClaimStatus(req: Request, res: Response) {
        try {
            const { puzzle_id } = req.params;
            
            const claim = await Claim.findOne({ puzzle_id });
            
            if (!claim) {
                return res.json({ claimed: false });
            }

            res.json({
                claimed: true,
                claim_id: claim._id,
                claimed_at: claim.claimed_at,
                status: claim.redemption_status
            });
        } catch (error) {
            res.status(500).json({ message: 'Failed to check claim status', error });
        }
    }
}