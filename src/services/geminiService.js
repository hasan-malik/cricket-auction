/**
 * Calls the Gemini proxy backend to get an AI bid decision.
 * Falls back to rule-based logic if the server is unreachable.
 */

const PROXY_URL = import.meta.env.VITE_GEMINI_PROXY_URL ?? 'http://localhost:3001';

export async function getGeminiBid({ player, aiBudget, currentBid, bidder, aiSquad, personality = 'balanced' }) {
  try {
    const res = await fetch(`${PROXY_URL}/api/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(4000), // don't hang the game
      body: JSON.stringify({ player, aiBudget, currentBid, bidder, aiSquad, personality }),
    });

    if (!res.ok) throw new Error(`Server ${res.status}`);
    return await res.json(); // { action: 'bid'|'pass', amount?: number }
  } catch {
    // Server offline or timed out → silent fallback
    return null;
  }
}
