// import type{ Request, Response,NextFunction } from 'express';
// import { Claim } from '../../../models/Claim.model.js';
// import { Puzzle } from '../../../models/Puzzle.model.js';
// import { Reward } from '../../../models/Reward.model.js';

// export class AdminClaimController {
//     static async viewAllClaims(req: Request, res: Response, next: NextFunction) {
//         try {
//             const claims = await Claim.find().sort({ claimed_at: -1 });
            
//             const claimsWithDetails = await Promise.all(
//                 claims.map(async (claim) => {
//                     const puzzle = await Puzzle.findOne({ puzzle_id: claim.puzzle_id });
//                     const reward = await Reward.findOne({ puzzle_id: claim.puzzle_id });
//                     return {
//                         ...claim.toObject(),
//                         puzzle,
//                         reward
//                     };
//                 })
//             );
            
//             res.json(claimsWithDetails);
//         } catch (error:any) {
//             // res.status(500).json({ message: 'Failed to fetch claims', error });
//             next(error)
//         }
//     }
// }

// src/controllers/admin/claim.controller.ts
import type{ Request, Response,NextFunction } from 'express';
import { Claim } from '../../../models/Claim.model.js';
import { Puzzle } from '../../../models/Puzzle.model.js';
import { Reward } from '../../../models/Reward.model.js';

export class AdminClaimController {
    static async viewAllClaims(req: Request, res: Response, next: NextFunction) {
        try {
            // Pagination params
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            // Filter params
            const { 
                redemption_status, 
                from_date, 
                to_date, 
                search,
                reward_type 
            } = req.query;

            // Build filter object for Claim
            let claimFilter: any = {};

            // Filter by redemption status
            if (redemption_status && ['pending', 'completed', 'failed'].includes(redemption_status as string)) {
                claimFilter.redemption_status = redemption_status;
            }

            // Filter by date range
            if (from_date || to_date) {
                claimFilter.claimed_at = {};
                if (from_date) {
                    claimFilter.claimed_at.$gte = new Date(from_date as string);
                }
                if (to_date) {
                    claimFilter.claimed_at.$lte = new Date(to_date as string);
                }
            }

            // First get claims with pagination
            const claims = await Claim.find(claimFilter)
                .sort({ claimed_at: -1 })
                .skip(skip)
                .limit(limit);

            // Get total count for pagination
            const totalCount = await Claim.countDocuments(claimFilter);

            // Enrich claims with puzzle and reward details
            let claimsWithDetails = await Promise.all(
                claims.map(async (claim) => {
                    const puzzle = await Puzzle.findOne({ puzzle_id: claim.puzzle_id });
                    const reward = await Reward.findOne({ puzzle_id: claim.puzzle_id });
                    
                    return {
                        claim_id: claim.claim_id,
                        puzzle_id: claim.puzzle_id,
                        user_device_id: claim.user_device_id,
                        claimed_at: claim.claimed_at,
                        redemption_status: claim.redemption_status,
                        puzzle_details: puzzle ? {
                            puzzle_id: puzzle.puzzle_id,
                            status: puzzle.status,
                            split_pieces_count: puzzle.split_pieces_count,
                            expires_at: puzzle.expires_at
                        } : null,
                        reward_details: reward ? {
                            reward_id: reward.reward_id,
                            reward_type: reward.reward_type,
                            reward_value: reward.reward_value,
                            terms: reward.terms,
                            is_active: reward.is_active
                        } : null
                    };
                })
            );

            // Apply additional filters that require joined data
            if (reward_type) {
                claimsWithDetails = claimsWithDetails.filter(
                    claim => claim.reward_details?.reward_type === reward_type
                );
            }

            if (search) {
                const searchLower = (search as string).toLowerCase();
                claimsWithDetails = claimsWithDetails.filter(
                    claim => 
                        claim.puzzle_id.toLowerCase().includes(searchLower) ||
                        claim.user_device_id.toLowerCase().includes(searchLower) ||
                        claim.reward_details?.reward_value?.toLowerCase().includes(searchLower)
                );
            }

            // Update total count after search filter
            const filteredTotalCount = claimsWithDetails.length;
            
            // Calculate pagination metadata
            const totalPages = Math.ceil(filteredTotalCount / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            res.json({
                success: true,
                data: claimsWithDetails,
                pagination: {
                    current_page: page,
                    limit: limit,
                    total_count: filteredTotalCount,
                    total_pages: totalPages,
                    has_next_page: hasNextPage,
                    has_prev_page: hasPrevPage,
                    showing_from: skip + 1,
                    showing_to: Math.min(skip + limit, filteredTotalCount)
                },
                filters: {
                    redemption_status: redemption_status || null,
                    reward_type: reward_type || null,
                    from_date: from_date || null,
                    to_date: to_date || null,
                    search: search || null
                },
                summary: {
                    total_claims: await Claim.countDocuments(),
                    pending_claims: await Claim.countDocuments({ redemption_status: 'pending' }),
                    completed_claims: await Claim.countDocuments({ redemption_status: 'completed' }),
                    failed_claims: await Claim.countDocuments({ redemption_status: 'failed' })
                }
            });
        } catch (error: any) {
            next(error);
        }
    }

    // Optional: Get single claim by ID
    static async getClaimById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            
            const claim = await Claim.findOne({ claim_id: id });
            
            if (!claim) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Claim not found' 
                });
            }

            const puzzle = await Puzzle.findOne({ puzzle_id: claim.puzzle_id });
            const reward = await Reward.findOne({ puzzle_id: claim.puzzle_id });

            res.json({
                success: true,
                data: {
                    claim: {
                        claim_id: claim.claim_id,
                        puzzle_id: claim.puzzle_id,
                        user_device_id: claim.user_device_id,
                        claimed_at: claim.claimed_at,
                        redemption_status: claim.redemption_status
                    },
                    puzzle_details: puzzle,
                    reward_details: reward
                }
            });
        } catch (error: any) {
            next(error);
        }
    }

    // Optional: Update claim status
    static async updateClaimStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { redemption_status } = req.body;

            if (!['pending', 'completed', 'failed'].includes(redemption_status)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid redemption status' 
                });
            }

            const claim = await Claim.findOneAndUpdate(
                { claim_id: id },
                { redemption_status },
                { new: true }
            );

            if (!claim) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Claim not found' 
                });
            }

            res.json({
                success: true,
                message: 'Claim status updated successfully',
                data: claim
            });
        } catch (error: any) {
            next(error);
        }
    }
}