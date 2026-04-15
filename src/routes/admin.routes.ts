import { Router } from 'express';
import { AdminAuthController } from '../module/admin/controllers/auth.controller.js';
import { AdminPuzzleController } from '../module/admin/controllers/puzzle.controller.js';
import { AdminClaimController } from '../module/admin/controllers/claim.controller.js';
import { AdminAnalyticsController } from '../module/admin/controllers/analytics.controller.js';
import { AdminRewardController } from '../module/admin/controllers/reward.controller.js';
import { verifyToken,adminOnly } from '../middleware/auth.middleware.js';

const controller=new AdminAuthController();
const router = Router();

// Auth (no middleware)
router.post('/login', controller.login);

// Protected routes
// router.use(verifyToken);

router.post('/puzzle/create',verifyToken,adminOnly, AdminPuzzleController.createPuzzleWithReward);//1
router.get('/puzzle/list',verifyToken,adminOnly, AdminPuzzleController.listAllPuzzles);//2
router.get('/puzzle/:id', verifyToken,adminOnly,AdminPuzzleController.getPuzzleById);
router.delete('/puzzle/:id', verifyToken,adminOnly,AdminPuzzleController.deletePuzzleById);
router.put('/puzzle/:id/status',verifyToken,adminOnly, AdminPuzzleController.updatePuzzleStatus);//3
router.get('/claims',verifyToken,adminOnly, AdminClaimController.viewAllClaims);//4
router.get('/claims/:id',verifyToken,adminOnly, AdminClaimController.getClaimById);//5 deleteClaimById
router.delete('/claims/:id',verifyToken,adminOnly, AdminClaimController.deleteClaimById);//8
router.put('/claims/:id/status',verifyToken,adminOnly, AdminClaimController.updateClaimStatus);//6
router.get('/analytics',verifyToken,adminOnly, AdminAnalyticsController.getAnalytics)//7
router.route('/forgot-password').post(controller.forgotPassword);
router.route('/reset-password').post(controller.resetPassword);
router.post(
    "/logout",
    verifyToken,
    adminOnly,
    controller.logout
);
router.get(
    "/profile",
    verifyToken,
    adminOnly,
    controller.getProfile
);

//Reward 
router.get('/rewards', verifyToken,adminOnly,AdminRewardController.getAllRewards);
router.get('/rewards/:id',verifyToken,adminOnly, AdminRewardController.getRewardById);
router.put('/rewards/:id',verifyToken,adminOnly, AdminRewardController.updateReward);
router.delete('/rewards/:id',verifyToken,adminOnly, AdminRewardController.deleteReward);
router.patch('/rewards/:id/toggle',verifyToken,adminOnly, AdminRewardController.toggleRewardStatus);

export default router;