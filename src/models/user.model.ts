import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    name: string;
    rewards: string[];
}

const UserSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    rewards: [{
        type: String,
        default: []
    }]
}, { timestamps: true });

UserSchema.index({ email: 1 })

export const User = mongoose.model<IUser>('User', UserSchema);