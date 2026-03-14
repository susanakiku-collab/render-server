
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 10000;

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  "http://127.0.0.1:5500",
  "http://localhost:5500"
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked: ${origin}`));
  }
}));

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
        error: "prompt is required"
      });
    }

    const response = await client.responses.create({
      model: "gpt-5",
      input: prompt
    });

    res.json({
      ok: true,
      text: response.output_text
    });
  } catch (error) {
    console.error("AI route error:", error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`THEMIS AI server running on port ${PORT}`);
});
