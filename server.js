import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.options("*", cors());
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

app.post("/api/ai", async (req, res) => {
  try {
    const { prompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({
        ok: false,
        error: "prompt required"
      });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a dispatch optimization AI. Return concise, valid JSON when requested." },
        { role: "user", content: prompt }
      ]
    });

    const text = completion.choices?.[0]?.message?.content || "";

    res.json({
      ok: true,
      text
    });

  } catch (error) {
    console.error("AI error:", error);
    res.status(500).json({
      ok: false,
      error: error?.message || "AI request failed"
    });
  }
});

app.listen(PORT, () => {
  console.log("THEMIS AI server running on port", PORT);
});
