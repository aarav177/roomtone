import mongoose from 'mongoose';
import Room from '../models/Room.js';
import { httpError } from '../utils/httpError.js';

export function serializeRoom(doc) {
  return { id: doc._id.toString(), name: doc.name };
}

export async function ensureDefaultRooms() {
  for (const name of ['general', 'random', 'help']) {
    await Room.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
  }
}

export async function listRooms() {
  const docs = await Room.find().sort({ createdAt: 1 });
  return docs.map(serializeRoom);
}

export async function createRoom(name) {
  const clean = String(name ?? '').trim().toLowerCase().replace(/\s+/g, '-');
  if (!/^[a-z0-9-]{2,30}$/.test(clean)) {
    throw httpError(400, 'Room names use 2-30 letters, numbers or dashes.');
  }
  if (await Room.exists({ name: clean })) throw httpError(409, 'That room already exists.');
  return serializeRoom(await Room.create({ name: clean }));
}

export async function getRoomOrThrow(roomId) {
  if (!mongoose.isValidObjectId(roomId)) throw httpError(400, 'Invalid room.');
  const doc = await Room.findById(roomId);
  if (!doc) throw httpError(404, 'Room not found.');
  return serializeRoom(doc);
}
