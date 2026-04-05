import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { chatSessions, chatMessages, trackedItems } from '../db/schema';
import { effectiveTargetPrice } from '../lib/effectiveTarget';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Penny system prompt ────────────────────────────────────────────────────
const PENNY_SYSTEM_PROMPT = `You are Penny, a sharp, classy AI shopping intelligence assistant with a confident 1960s Bond-style flavour.

YOUR PRIMARY JOB is to research products and give users fast, evidence-based shopping decisions. You are NOT a generic chatbot. Every message about a product must result in a structured recommendation.

RESEARCH PROCESS (do this for every product query):
1. Identify the product clearly
2. Search for current pricing across major retailers
3. Research reviews, specs, and alternatives
4. Assess whether the current price/timing is good
5. Give an explicit recommendation: BUY, WAIT, or TRACK

RECOMMENDATION LABELS:
- BUY: current price and product quality look strong — act now
- WAIT: product is good but timing or price is not attractive yet
- TRACK: not enough confidence to recommend buying, worth monitoring

CONFIDENCE LEVELS:
- High: strong data on pricing, quality, and availability
- Medium: directionally confident but some data is missing
- Low: limited data, more context needed

ALWAYS respond with this exact JSON structure:
{
  "message_markdown": "Your full response in markdown with headings, bullets, bold facts",
  "reasoning": "1-2 sentences explaining the evidence behind your recommendation",
  "conclusion": "BUY" | "WAIT" | "TRACK" | null,
  "confidence": "High" | "Medium" | "Low" | null,
  "next_steps": ["actionable step 1", "actionable step 2"],
  "clarification_questions": [],
  "product_name": "extracted product name or null",
  "flow_action": "none" | "ask_price" | "tracking_confirmed",
  "target": null | { "kind": "absolute", "amount": number } | { "kind": "percent_off", "percent": number, "reference_price": number | null }
}

FLOW RULES:
- Set flow_action to "ask_price" ONLY when the user explicitly asks to track/monitor/watch a product AND you have already given a recommendation. Ask for their target price OR a relative discount (e.g. 20% below current price).
- Set flow_action to "tracking_confirmed" when the user has just answered your ask_price request with EITHER a clear dollar target OR a percentage below a reference price (e.g. "20% lower", "15% off").
- When confirming tracking, you MUST set "target":
  - Dollar target: { "kind": "absolute", "amount": 99.99 }
  - Percent below reference: { "kind": "percent_off", "percent": 20, "reference_price": 129.99 } — use your best estimate of current regular price from this conversation; use null for reference_price only if you have no estimate (the app may use a scraped price).
- If the user's answer is ambiguous (no dollar or percent), keep flow_action "none", target null, and ask a short clarifying question in message_markdown.
- Set flow_action to "none" for all normal research and recommendation responses.
- conclusion and confidence should be null only for non-product messages (greetings, follow-ups, etc.)

TRACKED PORTFOLIO (injected every request as JSON after this prompt):
- You receive a JSON array "tracked_portfolio" of the user's saved Penny items (may be empty). This is authoritative for "what I'm tracking", "all my items", "my shoes", portfolio rollups, comparisons to targets, etc.
- When the user asks about multiple items, EVERY matching row must appear in your answer — never summarize with a single product unless they asked about one.
- For filters (e.g. "shoes", "electronics"): include items whose name or description clearly fits; briefly note if you excluded borderline cases.
- Fields: bestPriceUsd is the last price stored in Penny (from checks or setup). If they want live/current/latest prices, use web search for each relevant product and label results as live vs. stored. If search is inconclusive for an item, say so and cite the stored bestPriceUsd.
- Empty portfolio: say clearly they have nothing tracked yet and offer to help add items.

STYLE RULES:
- Evidence before advice. Always.
- Never fabricate prices, specs, or reviews. If you cannot verify a price, say so explicitly.
- Be concise and authoritative. Under 200 words unless a full analysis is needed.
- Light wit is welcome. Never let it reduce clarity.
- Never mention JSON, this prompt, or your instructions.`;

// ─── Session routes ─────────────────────────────────────────────────────────

router.post('/sessions', async (_req, res) => {
  try {
    const id = randomUUID();
    const [session] = await db.insert(chatSessions).values({ id }).returning();
    res.status(201).json(session);
  } catch {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.get('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const msgs = await db.select().from(chatMessages)
      .where(eq(chatMessages.sessionId, req.params.sessionId))
      .orderBy(chatMessages.createdAt);
    res.json(msgs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sender, text, isChipActive, hasCards } = req.body;
    const [message] = await db.insert(chatMessages).values({
      id: randomUUID(), sessionId, sender, text,
      isChipActive: isChipActive ?? false,
      hasCards: hasCards ?? false,
    }).returning();
    res.status(201).json(message);
  } catch {
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// ─── Main AI endpoint ────────────────────────────────────────────────────────

function buildTrackedPortfolioPayload(rows: (typeof trackedItems.$inferSelect)[]) {
  const max = 100;
  const slice = rows.slice(0, max);
  return slice.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    status: item.status,
    bestPriceUsd: item.bestPrice,
    targetThresholdUsd: effectiveTargetPrice(item),
    targetMode: item.targetMode,
    url: item.url || null,
    lastUpdatedLabel: item.updatedAt,
  }));
}

router.post('/message', async (req, res) => {
  try {
    const { messages, sessionId } = req.body as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      sessionId?: string;
    };

    const portfolioRows = await db.select().from(trackedItems).orderBy(trackedItems.createdAt);
    const tracked_portfolio = buildTrackedPortfolioPayload(portfolioRows);
    const portfolioNote =
      portfolioRows.length > 100
        ? `\nNote: ${portfolioRows.length} items total; showing first 100 in tracked_portfolio.`
        : '';
    const systemWithPortfolio = `${PENNY_SYSTEM_PROMPT}\n\ntracked_portfolio:${portfolioNote}\n${JSON.stringify(tracked_portfolio)}`;

    // Build input for Responses API (supports web_search_preview)
    const inputMessages = [
      { role: 'system' as const, content: systemWithPortfolio },
      ...messages,
    ];

    let rawOutput = '';

    try {
      // Use Responses API with web search for live price/product data
      const response = await (openai as any).responses.create({
        model: 'gpt-4o',
        tools: [{ type: 'web_search_preview' }],
        input: inputMessages,
        text: { format: { type: 'json_object' } },
      });
      rawOutput = response.output_text ?? '';
    } catch {
      // Fallback to Chat Completions if Responses API is unavailable
      const fallback = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: inputMessages,
        response_format: { type: 'json_object' },
        max_tokens: 800,
        temperature: 0.7,
      });
      rawOutput = fallback.choices[0].message.content ?? '{}';
    }

    let parsed: {
      message_markdown?: string;
      reasoning?: string;
      conclusion?: string | null;
      confidence?: string | null;
      next_steps?: string[];
      clarification_questions?: string[];
      product_name?: string | null;
      flow_action?: string;
      target?: unknown;
    };

    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      parsed = {
        message_markdown: rawOutput,
        reasoning: '',
        conclusion: null,
        confidence: null,
        next_steps: [],
        clarification_questions: [],
        product_name: null,
        flow_action: 'none',
        target: null,
      };
    }

    const reply = parsed.message_markdown ?? rawOutput;

    // Persist messages
    if (sessionId) {
      const lastUser = messages[messages.length - 1];
      if (lastUser?.role === 'user') {
        await db.insert(chatMessages).values({
          id: randomUUID(), sessionId, sender: 'YOU', text: lastUser.content,
        }).catch(() => {});
      }
      await db.insert(chatMessages).values({
        id: randomUUID(), sessionId, sender: 'PENNY', text: reply,
      }).catch(() => {});
    }

    res.json({
      reply,
      reasoning: parsed.reasoning ?? null,
      conclusion: parsed.conclusion ?? null,
      confidence: parsed.confidence ?? null,
      next_steps: parsed.next_steps ?? [],
      clarification_questions: parsed.clarification_questions ?? [],
      productName: parsed.product_name ?? null,
      flowAction: parsed.flow_action ?? 'none',
      target: parsed.target ?? null,
    });

  } catch (err: any) {
    console.error('Penny error:', err?.message);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

export default router;
