
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { withCors, preflight } from "@/lib/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { email, password } = Body.parse(data);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const res = NextResponse.json({ error: "User already exists" }, { status: 409 });
      return withCors(req, res);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash } });

    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email } }, { status: 201 });
    return withCors(req, res);
  } catch (err: any) {
    const res = NextResponse.json({ error: err.message || "Invalid input" }, { status: 400 });
    return res;
  }
}
