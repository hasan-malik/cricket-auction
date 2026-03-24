import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const app  = express();
const PORT = process.env.PORT ?? 3001;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

/**
 * POST /api/bid
 * Body: {
 *   player: { name, role, nationality, category, basePrice, stats },
 *   aiBudget: number,        // AI remaining budget in CR
 *   currentBid: number,      // current highest bid in CR
 *   bidder: 'user'|'ai'|null,
 *   aiSquad: { role: count },
 *   personality: 'aggressive'|'balanced'|'value'
 * }
 * Returns: { action: 'bid'|'pass', amount?: number }
 */
app.post('/api/bid', async (req, res) => {
  const { player, aiBudget, currentBid, aiSquad, personality = 'balanced' } = req.body;

  if (!player || aiBudget === undefined || currentBid === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Fallback: if no API key, return a rule-based decision
  if (!process.env.GEMINI_API_KEY) {
    const shouldBid = currentBid < player.basePrice * 1.5 && currentBid + 0.05 <= aiBudget;
    return res.json(
      shouldBid
        ? { action: 'bid', amount: Math.round((currentBid + 0.05) * 100) / 100 }
        : { action: 'pass' }
    );
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are an AI team manager in a PSL cricket auction with a ${personality} bidding strategy.
- aggressive: bid up to 2.5x base price on quality players, prioritise filling squad
- balanced: bid up to 1.8x base price, balance quality vs budget
- value: bid up to 1.3x base price, only buy players at a discount
You must respond with ONLY valid JSON: {"action":"bid","amount":X} or {"action":"pass"}
Amount must be in PKR Crore, rounded to 2 decimal places, and must be currentBid + 0.05 minimum.`;

    const squadDesc = Object.entries(aiSquad ?? {})
      .map(([role, count]) => `${count} ${role}`)
      .join(', ') || 'empty squad';

    const prompt = `${systemPrompt}

Current auction state:
- Player: ${player.name} (${player.role}, ${player.nationality}, ${player.category} category)
- PSL stats: ${player.stats.pslMatches} matches, ${player.stats.runs ?? 0} runs (avg ${player.stats.battingAvg ?? 'N/A'}, SR ${player.stats.strikeRate ?? 'N/A'}), ${player.stats.wickets ?? 0} wickets (econ ${player.stats.economy ?? 'N/A'})
- Base price: ${player.basePrice} CR
- Current bid: ${currentBid} CR
- My remaining budget: ${aiBudget} CR
- My current squad: ${squadDesc}

Should I bid? Respond with JSON only.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const json = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
    const decision = JSON.parse(json);

    // Validate
    if (!['bid', 'pass'].includes(decision.action)) throw new Error('Invalid action');
    if (decision.action === 'bid') {
      const minBid = Math.round((currentBid + 0.05) * 100) / 100;
      decision.amount = Math.max(minBid, Math.round((decision.amount ?? minBid) * 100) / 100);
      if (decision.amount > aiBudget) return res.json({ action: 'pass' });
    }

    res.json(decision);
  } catch (err) {
    console.error('Gemini error:', err.message);
    // Graceful fallback to rule-based
    const minBid = Math.round((currentBid + 0.05) * 100) / 100;
    const shouldBid = minBid <= aiBudget && currentBid < player.basePrice * 1.5;
    res.json(shouldBid ? { action: 'bid', amount: minBid } : { action: 'pass' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Gemini proxy running on http://localhost:${PORT}`);
});
