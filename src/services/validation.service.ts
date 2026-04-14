import { Puzzle } from '../models/Puzzle.model.js';
import { Claim } from '../models/Claim.model.js';

// export class ValidationService {
//     static async validateQRCode(qrText: string): Promise<{
//         valid: boolean;
//         message: string;
//         puzzle?: any;
//     }> {
//         const puzzle = await Puzzle.findOne({ qr_original_text: qrText });

//         if (!puzzle) {
//             return { valid: false, message: 'Invalid QR code' };
//         }

//         if (puzzle.created_at < new Date()) {
//             return { valid: false, message: 'QR code expired' };
//         }

//         const existingClaim = await Claim.findOne({ puzzle_id: puzzle._id });
//         if (existingClaim) {
//             return { valid: false, message: 'Reward already claimed' };
//         }

//         return { valid: true, message: 'Valid QR code', puzzle };
//     }
// }



export class ValidationService {
    static async validateQRCode(qrTextOrPuzzleId: string): Promise<{
        valid: boolean;
        message: string;
        puzzle?: any;
    }> {
        // Check if it's a full URL or just puzzle_id
        let puzzleId: string = qrTextOrPuzzleId as string;


        // Extract puzzle_id from URL if needed
        if (qrTextOrPuzzleId.includes('/scan/')) {
            const match = qrTextOrPuzzleId.match(/\/scan\/([a-f0-9-]+)/i);
            if (match) {
                if (!match[1] || match[1] == 'undefined') {
                    return { valid: false, message: 'QR text should be string' };
                }
                puzzleId = match[1];
            }
        }

        // Find puzzle by puzzle_id
        const puzzle = await Puzzle.findOne({ puzzle_id: puzzleId });

        if (!puzzle) {
            return { valid: false, message: 'Invalid QR code - Puzzle not found' };
        }

        // Check if expired
        if (puzzle.expires_at < new Date()) {
            return { valid: false, message: 'QR code has expired' };
        }

        // Check if already claimed
        const existingClaim = await Claim.findOne({ puzzle_id: puzzle.puzzle_id });
        if (existingClaim) {
            return { valid: false, message: 'Reward has already been claimed' };
        }

        return {
            valid: true,
            message: 'Valid QR code',
            puzzle
        };
    }
}