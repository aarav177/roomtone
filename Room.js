import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 30 },
  },
  { timestamps: true }
);

export default mongoose.model('Room', roomSchema);
