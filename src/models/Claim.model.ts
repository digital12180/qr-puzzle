// src/models/Claim.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { RedemptionStatus } from '../enums/index.js';

export interface IClaim extends Document {
  puzzle_id: string;
  user_device_id: string;
  redemption_status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const ClaimSchema = new Schema<IClaim>({
  puzzle_id: {
    type: String,
    required: true,
    ref: 'Puzzle',
    index: true
  },
  user_device_id: {
    type: String,
    required: true
  },
  redemption_status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
    required: true
  }
}, {
  timestamps: false
});

// Compound index to ensure unique claim per puzzle and user
ClaimSchema.index({ puzzle_id: 1, user_device_id: 1 }, { unique: true });

export const Claim = mongoose.model<IClaim>('Claim', ClaimSchema);