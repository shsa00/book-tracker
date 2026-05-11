import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { title, author } = await req.json();

  const prompt = `ACT AS A PROFESSIONAL LIBRARIAN. 
  Provide a strict, neutral book plot summary for "${title}" by ${author}.

  CONSTRAINTS:
  1. OUTPUT ONLY THE CONTENT. DO NOT include intros, outros, greetings, or meta-commentary about your search process.
  2. DO NOT use conversational phrases like "I found," "It seems," or "Based on my data."
  3. DO NOT include opinions or literary critiques.
  4. STRICTLY USE THIS HTML STRUCTURE:
    <h3>THE PLOT</h3>
    <p>[The plot summary]</p>
    <h3>CHARACTERS</h3>
    <p>[Character names in bullets]</p>

  If you cannot find the book, return ONLY: "<p>Synopsis currently unavailable.</p>"`;
  try {
    // --- ATTEMPT 1: GEMINI ---
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) throw new Error("GEMINI_KEY_MISSING");

    const genAI = new GoogleGenerativeAI(API_KEY);
    // Use 'gemini-1.5-flash-latest' - it is the most resilient free model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });


    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ summary: text, provider: "gemini" });

  } catch (error: any) {
    console.error("Gemini failed, trying Groq Fallback...", error.message);

    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) return NextResponse.json({ error: "All providers failed (Groq key missing)" }, { status: 500 });

    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // UPDATED MODEL NAME HERE
          model: "llama-3.1-8b-instant", 
          messages: [
            { role: "system", content: "You are a professional librarian." },
            { role: "user", content: prompt }
          ],
        }),
      });

      const groqData = await groqRes.json();
      
      if (groqData.error) {
        return NextResponse.json({ error: "Groq also failed", details: groqData.error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        summary: groqData.choices[0].message.content, 
        provider: "groq" 
      });

    } catch (fallbackError: any) {
      return NextResponse.json({ error: "Critical failure on all providers" }, { status: 500 });
    }
  }
}