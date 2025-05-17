// src/app/api/metabase/dashboard/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getCurrentUserWithTenant } from "@/lib/user";
import { checkRole } from "@/utils/roles";

export async function GET() {
  if (!(await checkRole("manager"))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await getCurrentUserWithTenant();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const METABASE_SITE_URL = process.env.NEXT_PUBLIC_METABASE_SITE_URL;
    const METABASE_SECRET_KEY = process.env.METABASE_SECRET_KEY;

    if (!METABASE_SITE_URL || !METABASE_SECRET_KEY) {
      return new NextResponse(
        METABASE_SECRET_KEY + "Metabase configuration missing",
        {
          status: 500,
        }
      );
    }

    console.log("User data:", JSON.stringify(user, null, 2));

    const tenantId = user.tenantId;

    console.log(`Using tenant ID: ${tenantId} for user ${user.id}`);

    const payload = {
      resource: { dashboard: 2 },
      params: {
        id: [tenantId],
      },
      iat: Math.round(Date.now() / 1000),
      exp: Math.round(Date.now() / 1000) + 10 * 60,
    };

    const token = jwt.sign(payload, METABASE_SECRET_KEY);
    const iframeUrl = `${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=true&titled=true`;

    return NextResponse.json({ iframeUrl });
  } catch (error) {
    console.error("Metabase token generation error:", error);
    return new NextResponse("Error generating Metabase URL", { status: 500 });
  }
}
