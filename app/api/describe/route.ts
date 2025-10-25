import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  console.log("✅ [API] /api/describe route reached");

  try {
    const { imageBase64, regions } = await req.json();
    console.log("📦 [API] Received payload:");
    console.log("  • imageBase64 length:", imageBase64?.length || 0);
    console.log("  • regions count:", regions?.length || 0);

    if (!imageBase64 || !regions) {
      console.error("❌ [API] Missing imageBase64 or regions");
      return Response.json(
        { error: "Missing imageBase64 or regions" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
    );
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log("⚙️ [API] Calling Gemini model...");
    const prompt = `
You are an accessibility AI describing an artwork for low- or no-vision users.

For more detailed descriptions, the artwork is divided into fixed-size squares (width 200–300px).
Each square needs a short supplementary description that complements the overall summary.

Provide one overall description and short regional captions for each square, altogether as JSON:
{
  "overall": "Brief general description of the entire artwork, 30–50 words.",
  "regions": [
    { "coords": [x, y], "caption": "Short description (max 20 words) of this region." }
  ]
}

Each region's coordinates (pixels relative to the image, origin at top-left) are listed below:
${JSON.stringify(regions, null, 2)}

Use these coordinates to estimate what appears in each area.
Focus on main compositional content, avoid repetition or minor background details.
Be concise, factual, and neutral.
Return only valid JSON — no commentary or explanation.
`;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
    ]);

    const responseText = result.response.text().trim();
    console.log("✅ [API] Gemini responded, length:", responseText.length);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!parsed) {
      console.error("❌ [API] Invalid JSON returned by Gemini");
      return Response.json(
        { error: "Model returned invalid JSON", raw: responseText },
        { status: 502 }
      );
    }

    console.log("✅ [API] Successfully parsed JSON response");
    return Response.json(parsed);
  } catch (err: any) {
    console.error("🔥 [API] Error in /api/describe:", err);
    return Response.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
