import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

await db.execute(`
  CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    data TEXT NOT NULL
  )
`);

function extractBlocks(rawRows: any[][]) {
  const blocks: { headers: string[]; rows: Record<string, any>[] }[] = [];
  const anchors = ["Type", "Defect Status"]; // header words that mark the start of a mini-table

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c]).trim();
      if (!anchors.includes(cell)) continue;

      const headers: string[] = [];
      for (let cc = c; cc < row.length; cc++) {
        const val = row[cc];
        if (val === undefined || val === "") break;
        headers.push(String(val).trim());
      }
      if (headers.length < 2) continue;

      const dataRows: Record<string, any>[] = [];
      for (let j = i + 1; j < rawRows.length; j++) {
        const dr = rawRows[j] || [];
        const label = dr[c];

        if (label === undefined || label === "") break;
        if (anchors.includes(String(label).trim())) break;
        if (/total/i.test(String(label).trim())) break; // skip totals rows

        const entry: Record<string, any> = {};
        headers.forEach((h, k) => {
          entry[h] = dr[c + k] ?? "";
        });
        dataRows.push(entry);
      }

      if (dataRows.length > 0) {
        blocks.push({ headers, rows: dataRows });
      }
    }
  }

  return blocks;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 });
    }

    // Basic file type check
    const validExtensions = [".xlsx", ".xls"];
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    if (!hasValidExtension) {
      return NextResponse.json(
        { error: "Please upload an Excel file (.xlsx or .xls)" },
        { status: 400 }
      );
    }

    // Basic size check (10MB limit, generous for a spreadsheet)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File is too large (max 10MB)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: "buffer" });
    } catch {
      return NextResponse.json(
        { error: "This file couldn't be read — it may be corrupted or not a valid Excel file" },
        { status: 400 }
      );
    }

    if (!workbook.SheetNames.length) {
      return NextResponse.json(
        { error: "This Excel file has no sheets" },
        { status: 400 }
      );
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    });

    const blocks = extractBlocks(rawRows);

    if (blocks.length === 0) {
      return NextResponse.json(
        { error: "Couldn't find any recognizable report tables in this sheet" },
        { status: 400 }
      );
    }

    const result = await db.execute({
      sql: "INSERT INTO uploads (filename, uploaded_at, data) VALUES (?, ?, ?)",
      args: [file.name, new Date().toISOString(), JSON.stringify({ blocks })],
    });

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}