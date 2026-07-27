import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ResearchChat from '@/models/ResearchChat';
import { getAuthenticatedUser } from '@/lib/server-auth';
import logger from "@/lib/logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimiter";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
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

        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        const chat = await (ResearchChat as any).findOne({ _id: id, userId: user._id || user.id });

        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        return NextResponse.json(chat);
    } catch (error) {
        logger.error('Error fetching one research chat:', error);
        return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
    }
}
