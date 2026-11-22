import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Denormalised so history loads without a join.
    senderName: { type: String, required: true },
    text: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true } // createdAt is the message timestamp
);

// Serves "latest N messages in a room" and cursor pagination on createdAt.
messageSchema.index({ room: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
