import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { message, blocks, filename } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // Give the AI context about the currently loaded report so it can
    // actually answer questions about the data, not just chat generically.
    const context = blocks && blocks.length > 0
      ? `The user currently has a report open called "${filename}". Here is the extracted data from it, as JSON:\n${JSON.stringify(blocks).slice(0, 8000)}`
      : "No report is currently loaded.";

    const prompt = `You are a helpful assistant embedded in a QA report dashboard website. Answer the user's question concisely and clearly, using the report data below when relevant.

${context}

User question: ${message}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    return NextResponse.json({ reply: response.text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to get a response" }, { status: 500 });
  }
}