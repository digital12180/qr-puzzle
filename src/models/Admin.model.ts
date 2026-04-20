import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
    email: string;
    password: string;
    role: 'admin' | 'operator';
}

const AdminSchema = new Schema<IAdmin>({
    email: { type: String, required: true, unique: true,index:true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['admin', 'operator'],
        default: 'operator'
    },
},{timestamps:true});

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);