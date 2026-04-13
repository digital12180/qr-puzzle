import userRoutes from "./user.routes.js";
import adminRoutes from "./admin.routes.js";
import express from "express";

const router=express.Router();

router.use('/admin',adminRoutes);
router.use('/user',userRoutes);

export default router;