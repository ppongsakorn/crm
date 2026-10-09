import Anthropic from "@anthropic-ai/sdk";
import AnthropicFoundry from "@anthropic-ai/foundry-sdk";

export type Provider = "anthropic" | "foundry";
export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

const EFFORTS: Effort[] = ["low", "medium", "high", "xhigh", "max"];

export const provider: Provider = process.env.AI_PROVIDER === "foundry" ? "foundry" : "anthropic";
export const model = process.env.AI_MODEL || "claude-opus-5-5";
export const effort: Effort = EFFORTS.includes(process.env.AI_EFFORT as Effort)
  ? (process.env.AI_EFFORT as Effort)
  : "medium";

/** True when credentials for the selected provider are present in the environment. */
export function isConfigured(): boolean {
  return provider === "foundry"
    ? Boolean(process.env.ANTHROPIC_FOUNDRY_API_KEY)
    : Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/** The slice of the SDK this app uses; both the Claude API and Foundry clients provide it. */
export type ChatClient = { beta: { messages: Pick<Anthropic["beta"]["messages"], "stream"> } };

let client: ChatClient | undefined;

/** Lazily constructed so `next build` works without credentials. */
export function getClient(): ChatClient {
  if (!client) {
    // Foundry reads ANTHROPIC_FOUNDRY_RESOURCE / ANTHROPIC_FOUNDRY_API_KEY;
    // the Claude API client reads ANTHROPIC_API_KEY.
    client = provider === "foundry" ? new AnthropicFoundry() : new Anthropic();
  }
  return client;
}

/**
 * Server-side refusal fallback ("default" routes by refusal category) is a
 * Claude API feature; on Foundry the request is sent without it.
 */
export function fallbackParams(): { betas?: Anthropic.Beta.AnthropicBeta[]; fallbacks?: "default" } {
  return provider === "anthropic" ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } : {};
}
