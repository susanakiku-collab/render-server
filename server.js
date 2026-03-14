import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 10000;

/* ---------------- CORS 完全許可 ---------------- */
app.use(cors());
app.options("*", cors());

/* ---------------- JSON ---------------- */
app.use(express.json({ limit: "1mb" }));

/* ---------------- OpenAI ---------------- */
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ---------------- サーバー確認 ---------------- */
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "THEMIS AI Dispatch Render Server",
    status: "running"
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/* ---------------- AI API ---------------- */
app.post("/api/ai", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      res.status(400).json({ ok: false, error: "prompt required" });
      return;
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a dispatch optimization AI." },
        { role: "user", content: prompt }
      ]
    });

    const text = completion.choices[0].message.content;

    res.json({
      ok: true,
      text
    });

  } catch (error) {
    console.error("AI error:", error);

    res.status(500).json({
      ok: false,
      error: error.message || "AI request failed"
    });
  }
});

/* ---------------- 起動 ---------------- */
app.listen(PORT, () => {
  console.log("THEMIS AI server running on port", PORT);
});
