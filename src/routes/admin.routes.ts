import { Router } from 'express';
import { AdminAuthController } from '../module/admin/controllers/auth.controller.js';
import { AdminPuzzleController } from '../module/admin/controllers/puzzle.controller.js';
import { AdminClaimController } from '../module/admin/controllers/claim.controller.js';
import { AdminAnalyticsController } from '../module/admin/controllers/analytics.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

// Auth (no middleware)
router.post('/login', AdminAuthController.login);

// Protected routes
router.use(verifyToken);
router.post('/puzzle/create', AdminPuzzleController.createPuzzleWithReward);
router.get('/puzzle/list', AdminPuzzleController.listAllPuzzles);
router.put('/puzzle/:id/status', AdminPuzzleController.updatePuzzleStatus);
router.get('/claims', AdminClaimController.viewAllClaims);
router.get('/analytics', AdminAnalyticsController.getAnalytics);

export default router;