import { Puzzle } from '../models/Puzzle.model.js';
import { Claim } from '../models/Claim.model.js';

export class ValidationService {
    static async validateQRCode(qrText: string): Promise<{
        valid: boolean;
        message: string;
        puzzle?: any;
    }> {
        const puzzle = await Puzzle.findOne({ qr_original_text: qrText });
        
        if (!puzzle) {
            return { valid: false, message: 'Invalid QR code' };
        }

        if (puzzle.getExpiryDate() < new Date()) {
            return { valid: false, message: 'QR code expired' };
        }

        const existingClaim = await Claim.findOne({ puzzle_id: puzzle._id });
        if (existingClaim) {
            return { valid: false, message: 'Reward already claimed' };
        }

        return { valid: true, message: 'Valid QR code', puzzle };
    }
}