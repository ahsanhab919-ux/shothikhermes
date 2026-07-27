import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SheetSession from '@/models/SheetSession';
import { getAuthenticatedUser } from '@/lib/server-auth';
import logger from "@/lib/logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimiter";

export async function GET(request: NextRequest) {
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
        const sessions = await (SheetSession as any).find({ userId: user._id || user.id }).sort({ updatedAt: -1 });
        return NextResponse.json(sessions);
    } catch (error) {
        logger.error('Error fetching sheet sessions:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
