import mongoose from 'mongoose';

const SheetSessionSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        title: { type: String, default: 'New Chat' },
        status: { type: String, default: 'active' },
    },
    { timestamps: true }
);

export default mongoose.models.SheetSession || mongoose.model('SheetSession', SheetSessionSchema);
