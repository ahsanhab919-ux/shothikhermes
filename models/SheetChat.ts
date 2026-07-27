import mongoose from 'mongoose';

const SheetChatSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        title: {
            type: String,
            default: 'New Spreadsheet',
        },
        status: {
            type: String,
            enum: ['idle', 'generating', 'completed', 'failed', 'cancelled'],
            default: 'idle',
        },
        events: [
            {
                step: String,
                message: String,
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        response: {
            type: Object, // Stores the rows/columns often
            default: {},
        },
        metadata: {
            type: Object,
            default: {},
        },
    },
    { timestamps: true }
);

export default mongoose.models.SheetChat || mongoose.model('SheetChat', SheetChatSchema);
