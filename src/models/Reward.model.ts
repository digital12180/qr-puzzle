// src/models/Reward.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { RewardType } from '../enums/index.js';

export interface IReward extends Document {
  puzzle_id: string;
  reward_type: 'food' | 'voucher' | 'merchandise' | 'digital';
  reward_value: string;
  terms: string | null;
  is_active: boolean;
  getFormattedReward(): string;
  createdAt: Date;
  updatedAt: Date;
}

const RewardSchema = new Schema<IReward>({
  puzzle_id: {
    type: String,
    required: true,
    unique: true,
    ref: 'Puzzle',
    index: true
  },
  reward_type: {
    type: String,
    enum: ['food', 'voucher', 'merchandise', 'digital'],
    required: true
  },
  reward_value: {
    type: String,
    required: true
  },
  terms: {
    type: String,
    default: null
  },
  is_active: {
    type: Boolean,
    default: true,
    required: true
  }
}, {
  timestamps: false
});

// Instance method
RewardSchema.methods.getFormattedReward = function (this: IReward): string {
  return `${this.reward_type}: ${this.reward_value}`;
};

export const Reward = mongoose.model<IReward>('Reward', RewardSchema);