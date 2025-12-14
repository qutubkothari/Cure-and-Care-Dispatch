export type IncomingMessage = {
  from: string;
  text: string;
};

export async function generateReply(msg: IncomingMessage): Promise<string> {
  // Placeholder “human-like” behavior: deterministic & safe until we plug in an LLM + conversation memory.
  const cleaned = msg.text.trim();
  if (!cleaned) return 'Hi — how can I help you today?';

  if (/\bhelp\b/i.test(cleaned)) {
    return 'Tell me the invoice number or the customer name, and what you want to do (status, notify, reschedule).';
  }

  return `Thanks — I got: “${cleaned}”. What’s the invoice number?`;
}
