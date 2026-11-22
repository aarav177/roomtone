import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listUsers } from '../services/userService.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ users: await listUsers() });
  })
);

export default router;
