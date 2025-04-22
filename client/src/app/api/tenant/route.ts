// src/app/api/tenant/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    // In a real application, you would fetch this from your database
    // or another service based on the current user/session
    const tenant = {
        name: "Your Company Name"
    };

    return NextResponse.json(tenant);
}
