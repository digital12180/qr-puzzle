// src/models/Puzzle.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPuzzle extends Document {
    puzzle_id: string;
    qr_original_text: string;
    reward_id: string;
    split_pieces_count: number;
    scrambled_image_url: string;
    pieces_urls: string[];  // ✅ IMPORTANT - Individual pieces for printing
    status: 'pending' | 'delivered' | 'solved' | 'expired';
    created_at: Date;
    expiry_days: number;
    expires_at: Date;
}

const PuzzleSchema = new Schema<IPuzzle>({
    puzzle_id: { type: String, required: true, unique: true },
    reward_id: { type: String, required: true, unique: true },
    qr_original_text: { type: String, required: true, unique: true },
    split_pieces_count: { type: Number, required: true, default: 4 },
    scrambled_image_url: { type: String, required: true },
    pieces_urls: [{ type: String, required: true }],  // ✅ ADD THIS
    status: { 
        type: String, 
        enum: ['pending', 'delivered', 'solved', 'expired'],
        default: 'pending'
    },
    created_at: { type: Date, default: Date.now },
    expiry_days: { type: Number, required: true, default: 30 },
    expires_at: { type: Date, required: true }
});

export const Puzzle = mongoose.model<IPuzzle>('Puzzle', PuzzleSchema);