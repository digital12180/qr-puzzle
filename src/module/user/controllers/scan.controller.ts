import type{ Request, Response } from 'express';
import { ValidationService } from '../../../services/validation.service.js';

export class UserScanController {
    static async scanQRCode(req: Request, res: Response) {
        try {
            const { qr_text } = req.body;
            
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
            res.status(500).json({ message: 'Scan failed', error });
        }
    }

    static async validateScannedPuzzle(req: Request, res: Response) {
        try {
            const { puzzle_id } = req.params;
            
            const validation = await ValidationService.validateQRCode(puzzle_id as string);
            
            res.json(validation);
        } catch (error) {
            res.status(500).json({ message: 'Validation failed', error });
        }
    }
}