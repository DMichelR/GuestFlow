import { NextResponse } from "next/server";
import { checkRole } from "@/utils/roles";

export async function GET() {
  // Verificar que el usuario sea manager
  if (!(await checkRole("manager"))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Si llegamos aquí, el usuario tiene permiso
  return NextResponse.json({ allowed: true });
}
