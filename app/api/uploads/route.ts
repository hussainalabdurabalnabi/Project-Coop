import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function GET() {
  try {
    const result = await db.execute(
      "SELECT id, filename, uploaded_at FROM uploads ORDER BY id DESC"
    );

    return NextResponse.json({ uploads: result.rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load uploads" }, { status: 500 });
  }
}