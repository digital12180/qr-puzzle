import mongoose, { Schema, Document } from 'mongoose';

export interface IReward extends Document {
    reward_id: string;
    puzzle_id: string;
    reward_type: 'food' | 'voucher' | 'merchandise' | 'digital';
    reward_value: string;
    terms: string;
    is_active: boolean;
    createdAt: Date;
}

const RewardSchema = new Schema<IReward>({
    reward_id: { type: String, required: true, unique: true },
    puzzle_id: { type: String, required: true, ref: 'Puzzle' },
    reward_type: {
        type: String,
        enum: ['food', 'voucher', 'merchandise', 'digital'],
        required: true
    },
    reward_value: { type: String, required: true },
    terms: { type: String, default: '' },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

export const Reward = mongoose.model<IReward>('Reward', RewardSchema);