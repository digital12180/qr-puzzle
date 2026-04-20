import mongoose, { Schema, Document } from 'mongoose';

export interface IClaim extends Document {
    claim_id: string;
    puzzle_id: string;
    user_device_id: string;
    claimed_at: Date;
    redemption_status: 'pending' | 'completed' | 'failed';
}

const ClaimSchema = new Schema<IClaim>({
    claim_id: { type: String, required: true, unique: true },
    puzzle_id: { type: String, required: true, ref: 'Puzzle' },
    user_device_id: { type: String, required: true },
    claimed_at: { type: Date, default: Date.now },
    redemption_status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    }
},{timestamps:true});

ClaimSchema.index({ claimed_at: -1 });
ClaimSchema.index({ puzzle_id: 1 });
ClaimSchema.index({ redemption_status: 1 });

export const Claim = mongoose.model<IClaim>('Claim', ClaimSchema);