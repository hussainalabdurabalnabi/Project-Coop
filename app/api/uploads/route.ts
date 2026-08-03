import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { auth } from "@/auth";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const result = await db.execute({
      sql: "SELECT id, filename, uploaded_at FROM uploads WHERE user_email = ? ORDER BY id DESC",
      args: [session.user.email],
    });

    return NextResponse.json({ uploads: result.rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load uploads" }, { status: 500 });
  }
}