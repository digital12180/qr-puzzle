import { fileURLToPath } from "url";
import { dirname } from "path";

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import  baseRoutes from './routes/index.routes.js'
// import morgan from "morgan";
// import helmet from "helmet";
// import compression from "compression";
// import cookieParser from "cookie-parser";


const app = express();

// app.use(helmet({
//   contentSecurityPolicy: false,
//   crossOriginEmbedderPolicy: false,
// }))
const allowedOrigins = [
  '*'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman / mobile apps

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
// app.use(compression());

// // Cookie parser
// app.use(cookieParser());

//Logging 
// if (process.env.NODE_ENV !== 'production') {
//   app.use(morgan('dev'));
// } else {
//   app.use(morgan('combined'));
// }
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
app.use((req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Custom header
  res.setHeader('X-Service-Name', 'QR-PUZZLE');

  next();
});

// ==================== ROOT ROUTE ====================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'QR PUZZLE Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/apis',baseRoutes);

export default app;