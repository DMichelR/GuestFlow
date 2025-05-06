// src/app/api/tenant/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    const tenant = {
        name: "Your Company Name"
    };

    return NextResponse.json(tenant);
}
