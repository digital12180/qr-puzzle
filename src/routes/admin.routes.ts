import { Router } from 'express';
import { AdminAuthController } from '../module/admin/controllers/auth.controller.js';
import { AdminPuzzleController } from '../module/admin/controllers/puzzle.controller.js';
import { AdminClaimController } from '../module/admin/controllers/claim.controller.js';
import { AdminAnalyticsController } from '../module/admin/controllers/analytics.controller.js';
import { AdminRewardController } from '../module/admin/controllers/reward.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const controller=new AdminAuthController();
const router = Router();

// Auth (no middleware)
router.post('/login', controller.login);

// Protected routes
// router.use(verifyToken);

router.post('/puzzle/create',verifyToken, AdminPuzzleController.createPuzzleWithReward);//1
router.get('/puzzle/list',verifyToken, AdminPuzzleController.listAllPuzzles);//2
router.get('/puzzle/:id', verifyToken,AdminPuzzleController.getPuzzleById);
router.delete('/puzzle/:id', verifyToken,AdminPuzzleController.deletePuzzleById);
router.put('/puzzle/:id/status',verifyToken, AdminPuzzleController.updatePuzzleStatus);//3
router.get('/claims',verifyToken, AdminClaimController.viewAllClaims);//4
router.get('/claims/:id',verifyToken, AdminClaimController.getClaimById);//5
router.put('/claims/:id/status',verifyToken, AdminClaimController.updateClaimStatus);//6
router.get('/analytics',verifyToken, AdminAnalyticsController.getAnalytics)//7
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

//Reward 
router.get('/rewards', verifyToken,AdminRewardController.getAllRewards);
router.get('/rewards/:id',verifyToken, AdminRewardController.getRewardById);
router.put('/rewards/:id',verifyToken, AdminRewardController.updateReward);
router.delete('/rewards/:id',verifyToken, AdminRewardController.deleteReward);
router.patch('/rewards/:id/toggle',verifyToken, AdminRewardController.toggleRewardStatus);

export default router;