import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SheetSession from '@/models/SheetSession';
import SheetConversation from '@/models/SheetConversation';
import logger from "@/lib/logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimiter";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const identifier = request.headers.get("authorization") || request.headers.get("x-forwarded-for") || "anonymous";
        const { allowed, remaining, resetAt } = await checkRateLimit(identifier, {
            windowMs: 60_000,
            maxRequests: 30,
        });
        if (!allowed) {
            return rateLimitResponse(remaining, resetAt);
        }

        const { chatId } = await params;
        if (!chatId) {
            return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
        }

        await dbConnect();

        const session = await (SheetSession as any).findById(chatId).lean();
        if (!session) {
            return NextResponse.json({ conversations: [], isIncomplete: false });
        }

        const conversations = await (SheetConversation as any).find({ sessionId: chatId })
            .sort({ createdAt: 1 })
            .lean();

        const lastConversation = conversations[conversations.length - 1];
        const isIncomplete =
            lastConversation?.status === 'generating' ||
            lastConversation?.status === 'failed';

        return NextResponse.json({
            session,
            conversations,
            isIncomplete,
        });
    } catch (error) {
        logger.error('[sheet/history]', error);
        return NextResponse.json({ conversations: [], isIncomplete: false });
    }
}
