import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: 'https://i.ibb.co/7X0247z/default-avatar.png' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);