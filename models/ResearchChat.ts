import mongoose from 'mongoose';

const ResearchChatSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        name: { type: String, default: 'New Research' },
        messages: [
            {
                role: { type: String, enum: ['user', 'assistant', 'system'] },
                content: String,
                timestamp: { type: Date, default: Date.now },
                metadata: Object, // citations, etc.
            }
        ],
        status: { type: String, default: 'active' },
    },
    { timestamps: true }
);

export default mongoose.models.ResearchChat || mongoose.model('ResearchChat', ResearchChatSchema);
