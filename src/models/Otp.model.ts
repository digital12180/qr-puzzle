import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// 🔥 AUTO DELETE AFTER EXPIRY (VERY IMPORTANT)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpModel = mongoose.model<IOtp>("Otp", otpSchema);