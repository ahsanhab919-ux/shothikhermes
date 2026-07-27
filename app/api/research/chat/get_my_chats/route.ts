import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ResearchChat from '@/models/ResearchChat';
import { getAuthenticatedUser } from '@/lib/server-auth';
import logger from "@/lib/logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimiter";

export async function GET(request: Request) {
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

        await dbConnect();
        const chats = await (ResearchChat as any).find({ userId: user._id || user.id })
            .select('-messages') // Optimization: Exclude messages to reduce payload size
            .sort({ updatedAt: -1 })
            .lean(); // Optimization: Return plain JS objects instead of Mongoose documents
        return NextResponse.json(chats);
    } catch (error) {
        logger.error('Error fetching research chats:', error);
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }
}
