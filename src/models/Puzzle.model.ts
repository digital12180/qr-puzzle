// src/models/Puzzle.model.ts
import mongoose, { Schema, Document } from 'mongoose';


export interface IPuzzle extends Document {
  qr_original_text: string;
  split_pieces_count: number;
  scrambled_image: string;
  status: 'pending' | 'delivered' | 'solved' | 'expired';
  expiry_days: number;
  pieces_urls: string[];
  isExpired(): boolean;
  getExpiryDate(): Date;
  createdAt: Date;
  updatedAt: Date;
}

const PuzzleSchema = new Schema<IPuzzle>({
  qr_original_text: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  split_pieces_count: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  scrambled_image: {
    type: String,
    required: true
  },
  pieces_urls: [{ type: String, required: true }],
  status: {
    type: String,
    enum: ['pending', 'delivered', 'solved', 'expired'],
    default: 'pending',
    required: true
  },
  expiry_days: {
    type: Number,
    default: 7,
    required: true,
    min: 1,
    max: 365
  }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for expiry date
PuzzleSchema.virtual('expiry_date').get(function (this: IPuzzle) {
  const expiryDate = new Date(this.createdAt);
  expiryDate.setDate(expiryDate.getDate() + this.expiry_days);
  return expiryDate;
});

// Instance methods
PuzzleSchema.methods.isExpired = function (this: IPuzzle): boolean {
  const now = new Date();
  const expiryDate = new Date(this.createdAt);
  expiryDate.setDate(expiryDate.getDate() + this.expiry_days);
  return now > expiryDate;
};

PuzzleSchema.methods.getExpiryDate = function (this: IPuzzle): Date {
  const expiryDate = new Date(this.createdAt);
  expiryDate.setDate(expiryDate.getDate() + this.expiry_days);
  return expiryDate;
};

// Pre-save middleware
PuzzleSchema.pre('save', function () {
  if (this.expiry_days < 1 || this.expiry_days > 365) {
    new Error('Expiry days must be between 1 and 365')
  }
});

export const Puzzle = mongoose.model<IPuzzle>('Puzzle', PuzzleSchema);