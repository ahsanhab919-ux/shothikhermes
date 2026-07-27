import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ResearchChat from '@/models/ResearchChat';
import logger from "@/lib/logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimiter";

export async function PUT(
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

        const { id } = await params;
        const body = await request.json();
        const { name } = body;

        await dbConnect();

        const chat = await (ResearchChat as any).findByIdAndUpdate(
            id,
            { title: name }, // Assuming 'name' maps to 'title' or 'name' in your schema
            { new: true }
        );

        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        return NextResponse.json(chat);

    } catch (error) {
        logger.error('Error updating chat name:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
