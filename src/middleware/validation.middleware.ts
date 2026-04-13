import type { Response, Request, NextFunction } from "express";
import { ZodAny } from "zod";

export const validate=(schema:ZodAny)=>{
    return async (req:Request,res:Response,next:NextFunction)=>{
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error) {
            return res.status(400).json({ message: 'Validation failed', errors: error });
        }
    }
}