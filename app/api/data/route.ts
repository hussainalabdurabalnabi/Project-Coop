import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { auth } from "@/auth";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");

    const result = id
      ? await db.execute({
          sql: "SELECT * FROM uploads WHERE id = ? AND user_email = ?",
          args: [id, session.user.email],
        })
      : await db.execute({
          sql: "SELECT * FROM uploads WHERE user_email = ? ORDER BY id DESC LIMIT 1",
          args: [session.user.email],
        });

    const row = result.rows[0] as any;

    if (!row) {
      return NextResponse.json({ error: "No uploads yet" }, { status: 404 });
    }

    const parsed = JSON.parse(row.data as string);

    return NextResponse.json({
      id: row.id,
      filename: row.filename,
      uploaded_at: row.uploaded_at,
      blocks: parsed.blocks,
      rawRows: parsed.rawRows ?? [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await db.execute({
      sql: "DELETE FROM uploads WHERE id = ? AND user_email = ?",
      args: [id, session.user.email],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}