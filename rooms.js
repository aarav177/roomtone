import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createRoom, getRoomOrThrow, listRooms } from '../services/roomService.js';
import { getHistory } from '../services/messageService.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ rooms: await listRooms() });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const room = await createRoom(req.body?.name);
    // Tell everyone connected so their room list updates live.
    req.app.get('io')?.emit('room:created', room);
    res.status(201).json({ room });
  })
);

router.get(
  '/:roomId/messages',
  asyncHandler(async (req, res) => {
    await getRoomOrThrow(req.params.roomId);
    const messages = await getHistory(req.params.roomId, {
      before: req.query.before,
      limit: req.query.limit,
    });
    res.json({ messages });
  })
);

export default router;
