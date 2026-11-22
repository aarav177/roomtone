import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginOrCreate } from '../services/userService.js';

const router = Router();

// Username-only sign in (no passwords). See README for how to upgrade to JWT auth.
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const user = await loginOrCreate(req.body?.username);
    res.json({ user });
  })
);

export default router;
