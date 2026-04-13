import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({
    path: './.env'
})

 export const connectDB = async (): Promise<void> => {
    try {

        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI not found in .env");
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log('MongoDB connected successfully!');

    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

