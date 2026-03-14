import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = String(process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map(v => v.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`));
  }
}));

app.use(express.json({ limit: "1mb" }));

function safeJsonParseLoose(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return fallback;
    try {
      return JSON.parse(match[0]);
    } catch {
      return fallback;
    }
  }
}

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "THEMIS AI Dispatch Render Server", status: "running" });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.post("/api/ai/dispatch-advice", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ ok: false, error: "OPENAI_API_KEY is not set" });
    }

    const payload = req.body || {};
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
あなたはTHEMIS AI Dispatchの配車補助AIです。
必ずJSONだけを返してください。説明文やコードフェンスは不要です。

目的:
- 車両バランス
- 帰宅方面との相性
- ラスト便の適性
- 同方面のまとまり
- 回転率

返却形式:
{
  "vehicleSuggestions": [
    {
      "item_id": 1,
      "vehicle_id": 2,
      "score_adjust": 12,
      "last_trip_fit": true,
      "reason": "帰宅方面と近く、当日距離バランスも良い"
    }
  ],
  "comment": "必要なら簡潔に"
}

入力データ:
${JSON.stringify(payload, null, 2)}
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5",
      input: prompt
    });

    const text = response.output_text || "{}";
    const data = safeJsonParseLoose(text, {});

    res.json({ ok: true, data });
  } catch (error) {
    console.error("dispatch-advice error:", error);
    res.status(500).json({ ok: false, error: error?.message || "Unknown server error" });
  }
});

app.listen(port, () => {
  console.log(`THEMIS AI server running on port ${port}`);
});
