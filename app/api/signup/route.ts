import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [email],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.execute({
      sql: "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
      args: [email, passwordHash, new Date().toISOString()],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}