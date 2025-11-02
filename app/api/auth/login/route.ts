
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const res = NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      return withCors(req, res);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const res = NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      return withCors(req, res);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      const res = NextResponse.json({ error: "Server misconfigured: JWT_SECRET missing" }, { status: 500 });
      return res;
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: "7d" });
    const res = NextResponse.json({ token, user: { id: user.id, email: user.email } });
    return withCors(req, res);
  } catch (err: any) {
    const res = NextResponse.json({ error: err.message || "Invalid input" }, { status: 400 });
    return res;
  }
}
