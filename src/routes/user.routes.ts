import { Router } from 'express';
import { UserScanController } from '../module/user/controllers/scan.controller.js';
import { UserRewardController } from '../module/user/controllers/reward.controller.js';
import { UserClaimController } from '../module/user/controllers/claim.controller.js';

const router = Router();

router.post('/scan', UserScanController.scanQRCode);
router.get('/validate/:puzzle_id', UserScanController.validateScannedPuzzle);
router.get('/reward/:puzzle_id', UserRewardController.getRewardDetails);
router.post('/claim', UserClaimController.claimReward);
router.get('/claim/status/:puzzle_id', UserClaimController.checkClaimStatus);
router.post('/detail',UserScanController.submitUsrDetails);

export default router;