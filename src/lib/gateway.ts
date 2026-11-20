export type GatewayConfig = {
  baseUrl: string;
  token: string;
  model: string;
  embeddingModel: string;
};

export function getGatewayConfig(): GatewayConfig | null {
  const baseUrl = process.env.NEON_AI_GATEWAY_BASE_URL;
  const token = process.env.NEON_AI_GATEWAY_TOKEN;
  if (!baseUrl || !token) return null;

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    token,
    model: process.env.NEON_AI_GATEWAY_MODEL || "gpt-5-mini",
    embeddingModel: process.env.NEON_EMBEDDING_MODEL || "text-embedding-3-small",
  };
}

export function isLiveMode() {
  return getGatewayConfig() !== null;
}
