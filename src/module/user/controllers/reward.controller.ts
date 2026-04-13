import type{ Request, Response ,NextFunction} from 'express';
import { Reward } from '../../../models/Reward.model.js';
import { Puzzle } from '../../../models/Puzzle.model.js';

export class UserRewardController {
    static async getRewardDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { puzzle_id } = req.params;
            
            const reward = await Reward.findOne({ puzzle_id });
            const puzzle = await Puzzle.findOne({ puzzle_id });
            
            if (!reward || !puzzle) {
                return res.status(404).json({ message: 'Reward not found' });
            }

            if (puzzle.created_at < new Date()) {
                return res.status(400).json({ message: 'Reward expired' });
            }

            res.json({
                reward_id: reward._id,
                reward_type: reward.reward_type,
                reward_value: reward.reward_value,
                terms: reward.terms,
                expires_at: puzzle.created_at
            });
        } catch (error) {
            // res.status(500).json({ message: 'Failed to fetch reward', error });
            next(error)
        }
    }
}