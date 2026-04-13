// src/controllers/admin/puzzle.controller.ts (updated)


import type { Request, Response } from 'express';
import { Puzzle } from '../../../models/Puzzle.model.js';
import { Reward } from '../../../models/Reward.model.js';
import { QRService } from '../../../services/qr.service.js';
import { ScrambleService } from '../../../services/scramble.service.js';
import { v4 as uuidv4 } from 'uuid';

export class AdminPuzzleController {
    // static async createPuzzleWithReward(req: Request, res: Response) {
    //     try {
    //         const { reward_type, reward_value, terms, expiry_days, difficulty } = req.body;

    //         const puzzleId = uuidv4();
    //         const rewardId = uuidv4();

    //         const qrText =await QRService.generateQRCode(puzzleId);
    //         console.log("qr text ----", qrText);

    //         // Generate actual QR code buffer
    //         const qrBuffer = await QRService.generateQRCodeBuffer(qrText);
    //         console.log("qr buffer ----", qrBuffer);
    //         // Scramble the QR code into pieces
    //         const { scrambledImageUrl, piecesUrls } = await ScrambleService.scrambleQRCode(
    //             qrBuffer,
    //             ScrambleService.getPieceCount(difficulty || 'medium')
    //         );

    //         const expiresAt = new Date();
    //         expiresAt.setDate(expiresAt.getDate() + expiry_days);

    //         const puzzle = await Puzzle.create({
    //             puzzle_id: puzzleId,
    //             qr_original_text: qrText,
    //             split_pieces_count: ScrambleService.getPieceCount(difficulty || 'medium'),
    //             scrambled_image_url: scrambledImageUrl,
    //             pieces_urls: piecesUrls, // Store individual piece URLs
    //             expiry_days: expiry_days,
    //             expires_at: expiresAt
    //         });

    //         const reward = await Reward.create({
    //             reward_id: rewardId,
    //             puzzle_id: puzzleId,
    //             reward_type,
    //             reward_value,
    //             terms,
    //             is_active: true
    //         });

    //         res.status(201).json({
    //             puzzle,
    //             reward,
    //             qr_text: qrText,
    //             print_pieces: piecesUrls // Send to frontend for printing
    //         });
    //     } catch (error) {

    //         console.log(error);

    //         res.status(500).json({ message: 'Failed to create puzzle', error });
    //     }
    // }

    static async createPuzzleWithReward(req: Request, res: Response) {
        try {
            const { reward_type, reward_value, terms, expiry_days, difficulty } = req.body;

            console.log(req.body);


            const puzzleId = uuidv4();
            const rewardId = uuidv4();

            const qrText = QRService.generateQRText(puzzleId);
            console.log("qrText===========", qrText);
            // ✅ Direct buffer
            const qrImageBuffer = await QRService.generateQRCodeBuffer(qrText);

            console.log("qrImageBuffer===========", qrImageBuffer);
            const validDifficulty = ['easy', 'medium', 'hard'].includes(difficulty)
                ? difficulty
                : 'medium';

            const pieces = ScrambleService.getPieceCount(validDifficulty);
            console.log("pieces===========", pieces);

            const { scrambledImageUrl, piecesUrls } =
                await ScrambleService.scrambleQRCode(qrImageBuffer, pieces);

            console.log("================", { scrambledImageUrl, piecesUrls });
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiry_days);

            const puzzle = await Puzzle.create({
                puzzle_id: puzzleId,
                qr_original_text: qrText,
                split_pieces_count: pieces,
                scrambled_image_url: scrambledImageUrl,
                pieces_urls: piecesUrls, // ✅ important
                expiry_days: expiry_days,
                expires_at: expiresAt
            });

            const reward = await Reward.create({
                reward_id: rewardId,
                puzzle_id: puzzleId,
                reward_type,
                reward_value,
                terms,
                is_active: true
            });

            res.status(201).json({
                puzzle,
                reward,
                qr_text: qrText,
                pieces: piecesUrls
            });

        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Failed to create puzzle', error });
        }
    }


    static async listAllPuzzles(req: Request, res: Response) {
        try {
            const puzzles = await Puzzle.find().sort({ created_at: -1 });
            res.json(puzzles);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch puzzles', error });
        }
    }

    static async updatePuzzleStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const puzzle = await Puzzle.findOneAndUpdate(
                { puzzle_id: id },
                { status },
                { new: true }
            );

            if (!puzzle) {
                return res.status(404).json({ message: 'Puzzle not found' });
            }

            res.json(puzzle);
        } catch (error) {
            res.status(500).json({ message: 'Failed to update puzzle', error });
        }
    }
}