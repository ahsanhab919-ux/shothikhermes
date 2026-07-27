import mongoose from 'mongoose';

const SheetConversationSchema = new mongoose.Schema(
    {
        sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SheetSession', required: true, index: true },
        prompt: { type: String, required: true },
        response: { type: Object, default: {} },
        events: [
            {
                step: String,
                message: String,
                timestamp: { type: Date, default: Date.now },
            },
        ],
        status: {
            type: String,
            enum: ['idle', 'generating', 'completed', 'failed', 'cancelled'],
            default: 'generating',
        },
    },
    { timestamps: true }
);

export default mongoose.models.SheetConversation || mongoose.model('SheetConversation', SheetConversationSchema);
