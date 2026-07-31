import mongoose from 'mongoose';

const serverSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serverName: { type: String, required: true },
    botNumber: { type: String, required: true },
    ownerNumber: { type: String, required: true },
    prefix: { type: String, default: '.' },
    durationDays: { type: Number, required: true },
    status: { type: String, enum: ['active', 'expired', 'stopped'], default: 'active' },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ServerInstance', serverSchema);