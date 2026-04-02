// Token-to-cost conversion
// Rates from chain-metrics.md (EUR, Feb 2025, blended 80% input / 20% output)

const RATES_EUR_PER_MTOK = {
  opus: 8.55,
  sonnet: 5.13,
  haiku: 1.71,
};

/**
 * Calculate estimated cost in EUR from token count and model name.
 * @param {number} tokens - total token count
 * @param {string} model - 'opus', 'sonnet', or 'haiku'
 * @returns {number} estimated cost in EUR
 */
export function calculateCost(tokens, model = 'sonnet') {
  const key = model.toLowerCase().includes('opus') ? 'opus'
    : model.toLowerCase().includes('haiku') ? 'haiku'
    : 'sonnet';
  const rate = RATES_EUR_PER_MTOK[key] || RATES_EUR_PER_MTOK.sonnet;
  return (tokens / 1_000_000) * rate;
}

/**
 * Estimate orchestrator overhead tokens.
 * Each tool call sends full conversation history + thinking.
 * @param {number} toolCalls - number of tool calls in session
 * @returns {number} estimated token count
 */
export function estimateOrchestratorTokens(toolCalls) {
  return toolCalls * 7500;
}

/**
 * Format cost for display.
 * @param {number} eur
 * @returns {string}
 */
export function formatCostEur(eur) {
  return `€${eur.toFixed(2)}`;
}
