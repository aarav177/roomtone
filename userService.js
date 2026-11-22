import mongoose from 'mongoose';
import User from '../models/User.js';
import { httpError } from '../utils/httpError.js';

const USERNAME_RE = /^[a-zA-Z0-9_]{2,20}$/;

export function serializeUser(doc) {
  return {
    id: doc._id.toString(),
    username: doc.username,
    isOnline: doc.isOnline,
    lastSeen: doc.lastSeen,
  };
}

export async function loginOrCreate(username) {
  const name = String(username ?? '').trim();
  if (!USERNAME_RE.test(name)) {
    throw httpError(400, 'Use 2-20 letters, numbers or underscores.');
  }
  const doc = await User.findOneAndUpdate(
    { username: name.toLowerCase() },
    { $setOnInsert: { username: name.toLowerCase() } },
    { upsert: true, new: true }
  );
  return serializeUser(doc);
}

export async function findUserById(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const doc = await User.findById(id);
  return doc ? serializeUser(doc) : null;
}

export async function listUsers() {
  const docs = await User.find().sort({ username: 1 });
  return docs.map(serializeUser);
}

export async function setPresence(userId, isOnline) {
  const doc = await User.findByIdAndUpdate(
    userId,
    { isOnline, lastSeen: new Date() },
    { new: true }
  );
  return serializeUser(doc);
}

export async function resetAllPresence() {
  await User.updateMany({ isOnline: true }, { isOnline: false, lastSeen: new Date() });
}
