import { Router } from 'express';
import { AdminAuthController } from '../module/admin/controllers/auth.controller.js';
import { AdminPuzzleController } from '../module/admin/controllers/puzzle.controller.js';
import { AdminClaimController } from '../module/admin/controllers/claim.controller.js';
import { AdminAnalyticsController } from '../module/admin/controllers/analytics.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const controller=new AdminAuthController();
const router = Router();

// Auth (no middleware)
router.post('/login', controller.login);

// Protected routes
// router.use(verifyToken);
router.post('/puzzle/create',verifyToken, AdminPuzzleController.createPuzzleWithReward);
router.get('/puzzle/list',verifyToken, AdminPuzzleController.listAllPuzzles);
router.put('/puzzle/:id/status',verifyToken, AdminPuzzleController.updatePuzzleStatus);
router.get('/claims',verifyToken, AdminClaimController.viewAllClaims);
router.get('/analytics',verifyToken, AdminAnalyticsController.getAnalytics);
router.route('/forgot-password').post(controller.forgotPassword);
router.route('/reset-password').post(controller.resetPassword);
router.post(
    "/logout",
    verifyToken,
    controller.logout
);
router.get(
    "/profile",
    verifyToken,
    controller.getProfile
);

export default router;