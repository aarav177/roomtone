import Message from '../models/Message.js';
import { httpError } from '../utils/httpError.js';

const MAX_LENGTH = 1000;

export function serializeMessage(doc) {
  return {
    id: doc._id.toString(),
    roomId: doc.room.toString(),
    senderId: doc.sender.toString(),
    senderName: doc.senderName,
    text: doc.text,
    createdAt: doc.createdAt,
  };
}

export async function createMessage({ roomId, user, text }) {
  const clean = String(text ?? '').trim();
  if (!clean) throw httpError(400, 'Message is empty.');
  if (clean.length > MAX_LENGTH) throw httpError(400, `Messages can be up to ${MAX_LENGTH} characters.`);

  const doc = await Message.create({
    room: roomId,
    sender: user.id,
    senderName: user.username,
    text: clean,
  });
  return serializeMessage(doc);
}

// Cursor pagination: pass `before` (an ISO date) to load older messages.
export async function getHistory(roomId, { before, limit } = {}) {
  const query = { room: roomId };
  if (before) {
    const date = new Date(before);
    if (Number.isNaN(date.getTime())) throw httpError(400, 'Invalid "before" date.');
    query.createdAt = { $lt: date };
  }
  const size = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const docs = await Message.find(query).sort({ createdAt: -1 }).limit(size);
  return docs.reverse().map(serializeMessage);
}
