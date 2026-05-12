export interface ProviderOption {
  id: string;
  label: string;
  type: "openai" | "gemini" | "compatible" | string;
  enabled: boolean;
  defaultTextModel: string;
  defaultImageModel: string;
  supportsImages: boolean;
}

export interface AiRuntimeConfig {
  providers: ProviderOption[];
}

export interface ProductDirection {
  title: string;
  description: string;
  definition: {
    positioning: string;
    targetUser: string;
    usp: string[];
    features: string[];
    materials: string;
    cmf: string;
    priceRange: string;
    differentiation: string;
  };
  designPrompts: {
    mj: string;
    sd: string;
    description: string;
    cmfSuggestions: string;
    structuralSuggestions: string;
  };
}

export interface AnalysisResult {
  engine: "micro" | "gene" | "demand";
  market: {
    amazonTopProducts: { title: string; price: string; rating: number; reviews: number }[];
    trends: string;
    tiktokInsights: string[];
  };
  problems: {
    topIssues: { category: string; frequency: string; priority: "High" | "Medium" | "Low"; sentiment: number }[];
    optimizationList: string[];
  };
  hitProduct: {
    formula: string;
    priceRange: string;
    coreFeatures: string[];
    styleKeywords: string[];
    sellingPoints: string[];
  };
  opportunities: {
    unmetNeeds: string[];
    newOpportunities: { title: string; score: number; description: string }[];
  };
  directions: ProductDirection[];
}

export interface AiRequestOptions {
  providerId: string;
  textModel: string;
  imageModel: string;
}

async function requestAi<T>(payload: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "AI proxy request failed.");
  }

  return data;
}

export async function fetchAiConfig(): Promise<AiRuntimeConfig> {
  const response = await fetch("/api/ai");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to load AI provider configuration.");
  }

  return data;
}

export async function analyzeProductData(
  engine: "micro" | "gene" | "demand",
  data: string,
  options: AiRequestOptions,
): Promise<AnalysisResult> {
  const response = await requestAi<{ result: AnalysisResult }>({
    action: "analyze",
    engine,
    data,
    providerId: options.providerId,
    textModel: options.textModel,
  });

  return response.result;
}

export async function generateDesignImage(prompt: string, options: AiRequestOptions): Promise<string> {
  const response = await requestAi<{ image: string }>({
    action: "generateImage",
    prompt,
    providerId: options.providerId,
    imageModel: options.imageModel,
  });

  return response.image;
}

export async function iterateDesign(
  direction: ProductDirection,
  feedback: string,
  options: AiRequestOptions,
): Promise<{ newPrompt: string; rationale: string }> {
  const response = await requestAi<{ result: { newPrompt: string; rationale: string } }>({
    action: "iterate",
    direction,
    feedback,
    providerId: options.providerId,
    textModel: options.textModel,
  });

  return response.result;
}
