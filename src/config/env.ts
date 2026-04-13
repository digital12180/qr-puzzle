import dotenv from 'dotenv';
dotenv.config();

export const env = {
    PORT: process.env.PORT || 9096,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://sagar:digitalnightowl@ac-zk3g8xw-shard-00-00.bsvkcuy.mongodb.net:27017,ac-zk3g8xw-shard-00-01.bsvkcuy.mongodb.net:27017,ac-zk3g8xw-shard-00-02.bsvkcuy.mongodb.net:27017/qrpuzzle?ssl=true&replicaSet=atlas-4oic35-shard-0&authSource=admin&appName=Cluster0',
    JWT_SECRET: process.env.JWT_SECRET || 'default_secret',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10'),
    // FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001'
};