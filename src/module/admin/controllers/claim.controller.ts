import type{ Request, Response,NextFunction } from 'express';
import { Claim } from '../../../models/Claim.model.js';
import { Puzzle } from '../../../models/Puzzle.model.js';
import { Reward } from '../../../models/Reward.model.js';

export class AdminClaimController {
    static async viewAllClaims(req: Request, res: Response, next: NextFunction) {
        try {
            const claims = await Claim.find().sort({ claimed_at: -1 });
            
            const claimsWithDetails = await Promise.all(
                claims.map(async (claim) => {
                    const puzzle = await Puzzle.findOne({ puzzle_id: claim.puzzle_id });
                    const reward = await Reward.findOne({ puzzle_id: claim.puzzle_id });
                    return {
                        ...claim.toObject(),
                        puzzle,
                        reward
                    };
                })
            );
            
            res.json(claimsWithDetails);
        } catch (error:any) {
            // res.status(500).json({ message: 'Failed to fetch claims', error });
            next(error)
        }
    }
}