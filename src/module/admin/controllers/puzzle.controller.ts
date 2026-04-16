// src/controllers/admin/puzzle.controller.ts (updated)


// import type { Request, Response, NextFunction } from 'express';
// import { Puzzle } from '../../../models/Puzzle.model.js';
// import { Reward } from '../../../models/Reward.model.js';
// import { QRService } from '../../../services/qr.service.js';
// import { ScrambleService } from '../../../services/scramble.service.js';
// import { v4 as uuidv4 } from 'uuid';

// export class AdminPuzzleController {
//     static async createPuzzleWithReward(req: Request, res: Response, next: NextFunction) {
//         try {
//             const { reward_type, reward_value, terms, expiry_days, difficulty } = req.body;

//             console.log(req.body);


//             const puzzleId = uuidv4();
//             const rewardId = uuidv4();

//             const qrText = QRService.generateQRText(puzzleId);
//             // ✅ Direct buffer
//             const qrImageBuffer = await QRService.generateQRCodeBuffer(qrText);

//             const validDifficulty = ['easy', 'medium', 'hard'].includes(difficulty)
//                 ? difficulty
//                 : 'medium';

//             const pieces = ScrambleService.getPieceCount(validDifficulty);

//             const { scrambledImageUrl, piecesUrls } =
//                 await ScrambleService.scrambleQRCode(qrImageBuffer, pieces);

//             const expiresAt = new Date();
//             expiresAt.setDate(expiresAt.getDate() + expiry_days);

//             const puzzle = await Puzzle.create({
//                 puzzle_id: puzzleId,
//                 qr_original_text: qrText,
//                 split_pieces_count: pieces,
//                 scrambled_image_url: scrambledImageUrl,
//                 pieces_urls: piecesUrls, // ✅ important
//                 expiry_days: expiry_days,
//                 expires_at: expiresAt
//             });

//             const reward = await Reward.create({
//                 reward_id: rewardId,
//                 puzzle_id: puzzleId,
//                 reward_type,
//                 reward_value,
//                 terms,
//                 is_active: true
//             });

//             res.status(201).json({
//                 puzzle,
//                 reward,
//                 qr_text: qrText,
//                 pieces: piecesUrls
//             });

//         } catch (error) {
//             console.log(error);
//             // res.status(500).json({ message: 'Failed to create puzzle', error });
//             next(error)
//         }
//     }

//     static async listAllPuzzles(req: Request, res: Response, next: NextFunction) {
//         try {
//             // Pagination params
//             const page = parseInt(req.query.page as string) || 1;
//             const limit = parseInt(req.query.limit as string) || 10;
//             const skip = (page - 1) * limit;

//             // Filter params
//             const { status, reward_type, from_date, to_date, search } = req.query;

//             // Build filter object
//             let filter: any = {};

//             // Filter by status
//             if (status && ['pending', 'delivered', 'solved', 'expired'].includes(status as string)) {
//                 filter.status = status;
//             }

//             // Filter by date range
//             if (from_date || to_date) {
//                 filter.created_at = {};
//                 if (from_date) {
//                     filter.created_at.$gte = new Date(from_date as string);
//                 }
//                 if (to_date) {
//                     filter.created_at.$lte = new Date(to_date as string);
//                 }
//             }

//             // Search by puzzle_id or qr_original_text
//             if (search) {
//                 filter.$or = [
//                     { puzzle_id: { $regex: search, $options: 'i' } },
//                     { qr_original_text: { $regex: search, $options: 'i' } }
//                 ];
//             }

//             // Execute queries in parallel
//             const [puzzles, totalCount] = await Promise.all([
//                 Puzzle.find(filter)
//                     .sort({ created_at: -1 })
//                     .skip(skip)
//                     .limit(limit),
//                 Puzzle.countDocuments(filter)
//             ]);

//             // Calculate pagination metadata
//             const totalPages = Math.ceil(totalCount / limit);
//             const hasNextPage = page < totalPages;
//             const hasPrevPage = page > 1;

//             res.json({
//                 success: true,
//                 data: puzzles,
//                 pagination: {
//                     current_page: page,
//                     limit: limit,
//                     total_count: totalCount,
//                     total_pages: totalPages,
//                     has_next_page: hasNextPage,
//                     has_prev_page: hasPrevPage
//                 },
//                 filters: {
//                     status: status || null,
//                     from_date: from_date || null,
//                     to_date: to_date || null,
//                     search: search || null
//                 }
//             });
//         } catch (error) {
//             next(error);
//         }
//     }

//     static async updatePuzzleStatus(req: Request, res: Response, next: NextFunction) {
//         try {
//             const { id } = req.params;
//             const { status } = req.body;

//             const puzzle = await Puzzle.findOneAndUpdate(
//                 { puzzle_id: id },
//                 { status },
//                 { new: true }
//             );

//             if (!puzzle) {
//                 return res.status(404).json({ message: 'Puzzle not found' });
//             }

//             res.json(puzzle);
//         } catch (error) {
//             // res.status(500).json({ message: 'Failed to update puzzle', error });
//             next(error)
//         }
//     }
// }

// src/controllers/admin/puzzle.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { Puzzle } from '../../../models/Puzzle.model.js';
import { Reward } from '../../../models/Reward.model.js';
import { QRService } from '../../../services/qr.service.js';
import { ScrambleService } from '../../../services/scramble.service.js';
import { v4 as uuidv4 } from 'uuid';
import { uploadToCloudinary } from '../../../config/cloudinary.js';
import { getFileBuffer } from '../../../utils/buffer.file.js';
import path from "path";
import fs from "fs";
import { APIResponse } from '../../../utils/apiResponse.js';
import { generateUniqueKey } from '../../../utils/generateId.js';

export class AdminPuzzleController {

    static async createPuzzleWithReward(req: Request, res: Response, next: NextFunction) {
        try {
            const { reward_type, reward_value, terms, expiry_days, difficulty, } = req.body;

            if (!reward_type || !reward_value || !terms || !expiry_days || !difficulty) {
                return res.json(new APIResponse(false, "All fields are required!"))
            }

            const puzzleId = generateUniqueKey();
            const rewardId = generateUniqueKey();

            const qrText = QRService.generateQRText(puzzleId);
            const qrImageBuffer = await QRService.generateQRCodeBuffer(qrText);

            const validDifficulty = ['easy', 'medium', 'hard'].includes(difficulty)
                ? difficulty
                : 'medium';

            const pieces = ScrambleService.getPieceCount(validDifficulty);

            const { scrambledImageUrl, piecesUrls } =
                await ScrambleService.scrambleQRCode(qrImageBuffer, pieces);

            const scrambledFullPath = path.join(
                process.cwd(),
                "public",
                scrambledImageUrl
            );
            const piecesFullPaths = piecesUrls.map((url) =>
                path.join(process.cwd(), "public", url)
            );
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiry_days);

            // 🔥 Upload scrambled + all pieces together (fast)
            const [uploadedScrambled, uploadedPieces] = await Promise.all([
                uploadToCloudinary(fs.readFileSync(scrambledFullPath)),

                Promise.all(
                    piecesFullPaths.map((filePath) =>
                        uploadToCloudinary(fs.readFileSync(filePath))
                    )
                )
            ]);

            // fs.unlinkSync(scrambledImageUrl);

            // piecesUrls.forEach((file) => fs.unlinkSync(file));


            const puzzle = await Puzzle.create({
                puzzle_id: puzzleId,
                reward_id: rewardId,
                qr_original_text: qrText,
                split_pieces_count: pieces,
                scrambled_image_url: uploadedScrambled,
                pieces_urls: uploadedPieces,
                expiry_days: expiry_days,
                expires_at: expiresAt,
                status: 'pending'  // ✅ Explicitly set initial status
            });

            const reward = await Reward.create({
                reward_id: rewardId,
                puzzle_id: puzzleId,
                reward_type,
                reward_value,
                terms,
                is_active: true
            });

            // ✅ PROPER RESPONSE FOR PHYSICAL PRINTING
            res.status(201).json({
                success: true,
                message: 'Puzzle created successfully',
                data: {
                    puzzle: {
                        puzzle_id: puzzle.puzzle_id,
                        status: puzzle.status,
                        split_pieces_count: puzzle.split_pieces_count,
                        expiry_days: puzzle.expiry_days,
                        expires_at: puzzle.expires_at,
                        created_at: puzzle.created_at
                    },
                    reward: {
                        reward_id: reward.reward_id,
                        reward_type: reward.reward_type,
                        reward_value: reward.reward_value,
                        terms: reward.terms
                    },
                    // ✅ FOR PRINTING KIT - Individual pieces
                    print_kit: {
                        pieces_urls: piecesUrls,  // Individual piece images
                        total_pieces: pieces,
                        instructions: "Print these pieces separately, cut them out, and deliver as puzzle kit"
                    },
                    // ✅ FOR PREVIEW ONLY - Scrambled image
                    preview: {
                        scrambled_image_url: scrambledImageUrl,
                        note: "This is just a preview. Use pieces_urls for printing physical puzzle"
                    },
                    // ✅ FOR VALIDATION - Original QR text (keep secret, don't show to user)
                    qr_text_for_reference: qrText
                }
            });

        } catch (error) {
            console.error('Create puzzle error:', error);
            next(error);
        }
    }

    static async listAllPuzzles(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const { status, from_date, to_date, search } = req.query;

            let filter: any = {};

            if (status && ['pending', 'delivered', 'solved', 'expired'].includes(status as string)) {
                filter.status = status;
            }

            if (from_date || to_date) {
                filter.created_at = {};
                if (from_date) {
                    filter.created_at.$gte = new Date(from_date as string);
                }
                if (to_date) {
                    filter.created_at.$lte = new Date(to_date as string);
                }
            }
            //  console.log("ser----------",search);

            if (search) {
                filter.$or = [
                    { puzzle_id: { $regex: search, $options: 'i' } },
                    { qr_original_text: { $regex: search, $options: 'i' } }
                ];
            }

            const [puzzles, totalCount] = await Promise.all([
                Puzzle.find(filter)
                    .select('-pieces_urls -qr_original_text') 
                    .populate('reward_id') // ✅ Don't expose sensitive data in list
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(limit),
                Puzzle.countDocuments(filter)
            ]);

            //    console.log("puzzles----------",puzzles);
            const totalPages = Math.ceil(totalCount / limit);

            res.json({
                success: true,
                data: puzzles,
                pagination: {
                    current_page: page,
                    limit: limit,
                    total_count: totalCount,
                    total_pages: totalPages,
                    has_next_page: page < totalPages,
                    has_prev_page: page > 1
                },
                filters: {
                    status: status || null,
                    from_date: from_date || null,
                    to_date: to_date || null,
                    search: search || null
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // ✅ NEW: Get single puzzle with full details (for printing)
    static async getPuzzleById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const puzzle = await Puzzle.findOne({ puzzle_id: id });

            if (!puzzle) {
                return res.status(404).json({ success: false, message: 'Puzzle not found' });
            }

            const reward = await Reward.findOne({ puzzle_id: id });

            res.json({
                success: true,
                data: {
                    puzzle: {
                        puzzle_id: puzzle.puzzle_id,
                        split_pieces_count: puzzle.split_pieces_count,
                        pieces_urls: puzzle.pieces_urls,  // ✅ For printing
                        status: puzzle.status,
                        qr_text: puzzle.qr_original_text,
                        expires_at: puzzle.expires_at
                    },
                    reward: reward ? {
                        reward_type: reward.reward_type,
                        reward_value: reward.reward_value,
                        terms: reward.terms
                    } : null
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async deletePuzzleById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const puzzle = await Puzzle.findOneAndDelete({ puzzle_id: id });

            if (!puzzle) {
                return res.status(404).json({ success: false, message: 'Puzzle not found' });
            }

            const reward = await Reward.findOneAndDelete({ puzzle_id: id });

            res.json({
                success: true,
                message: "Puzzle deleted successfully!",
                data: null
            });
        } catch (error) {
            next(error);
        }
    }

    static async updatePuzzleStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status, expiry_days } = req.body;

            const puzzle = await Puzzle.findOne({ puzzle_id: id });

            if (!puzzle) {
                return res.status(404).json({ message: 'Puzzle not found' });
            }

            // 🔥 Expiry check (before update)
            if (new Date() > puzzle.expires_at) {
                puzzle.status = "expired";
                await puzzle.save();

                return res.status(400).json({
                    success: false,
                    message: "Puzzle expired"
                });
            }

            // 🔥 Status rules
            if (puzzle.status === "solved") {
                return res.status(400).json({
                    message: "Puzzle already solved"
                });
            }

            if (puzzle.status === "expired") {
                return res.status(400).json({
                    message: "Puzzle expired"
                });
            }

            // ===============================
            // ✅ UPDATE STATUS (optional)
            // ===============================
            if (status) {
                puzzle.status = status;

                if (status === "delivered") {
                    (puzzle as any).delivered_at = new Date();
                }

                if (status === "solved") {
                    (puzzle as any).solved_at = new Date();
                }
            }

            // ===============================
            // ✅ UPDATE EXPIRY (optional)
            // ===============================
            if (expiry_days) {
                puzzle.expiry_days = expiry_days;

                const newExpiry = new Date();
                newExpiry.setDate(newExpiry.getDate() + expiry_days);

                puzzle.expires_at = newExpiry;
                puzzle.status = "expired";
            }

            await puzzle.save();

            res.json({
                success: true,
                message: 'Puzzle updated successfully',
                data: puzzle
            });

        } catch (error) {
            next(error);
        }
    }
}