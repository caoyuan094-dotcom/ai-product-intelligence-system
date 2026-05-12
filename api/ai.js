const DEFAULT_PROVIDERS = [
  {
    id: "openai",
    label: "OpenAI",
    type: "openai",
    apiKeyEnv: "OPENAI_API_KEY",
    baseUrl: "https://api.openai.com/v1",
    defaultTextModel: process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini",
    defaultImageModel: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
    supportsImages: true,
  },
  {
    id: "gemini",
    label: "Google Gemini",
    type: "gemini",
    apiKeyEnv: "GEMINI_API_KEY",
    defaultTextModel: process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview",
    defaultImageModel: process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image",
    supportsImages: true,
  },
  {
    id: "compatible",
    label: process.env.COMPATIBLE_PROVIDER_LABEL || "OpenAI-Compatible",
    type: "compatible",
    apiKeyEnv: "COMPATIBLE_API_KEY",
    baseUrl: process.env.COMPATIBLE_BASE_URL || "https://api.openai.com/v1",
    defaultTextModel: process.env.COMPATIBLE_TEXT_MODEL || "deepseek-chat",
    defaultImageModel: process.env.COMPATIBLE_IMAGE_MODEL || "",
    supportsImages: process.env.COMPATIBLE_SUPPORTS_IMAGES === "true",
  },
];

function getProviders() {
  if (process.env.AI_PROVIDERS) {
    try {
      const parsed = JSON.parse(process.env.AI_PROVIDERS);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((provider) => ({
          ...provider,
          apiKeyEnv: provider.apiKeyEnv || `${String(provider.id).toUpperCase()}_API_KEY`,
          supportsImages: Boolean(provider.supportsImages),
        }));
      }
    } catch (error) {
      console.error("Invalid AI_PROVIDERS JSON:", error);
    }
  }

  return DEFAULT_PROVIDERS;
}

function getPublicProviders() {
  return getProviders().map((provider) => ({
    id: provider.id,
    label: provider.label,
    type: provider.type,
    enabled: Boolean(process.env[provider.apiKeyEnv]),
    defaultTextModel: provider.defaultTextModel || "",
    defaultImageModel: provider.defaultImageModel || "",
    supportsImages: Boolean(provider.supportsImages),
  }));
}

function resolveProvider(providerId) {
  const providers = getProviders();
  const provider = providers.find((item) => item.id === providerId) || providers[0];
  if (!provider) {
    throw new Error("No AI providers configured.");
  }

  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`${provider.label || provider.id} is missing ${provider.apiKeyEnv}.`);
  }

  return { ...provider, apiKey };
}

function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

const analysisSchema = {
  type: "object",
  properties: {
    market: {
      type: "object",
      properties: {
        amazonTopProducts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              price: { type: "string" },
              rating: { type: "number" },
              reviews: { type: "number" },
            },
          },
        },
        trends: { type: "string" },
        tiktokInsights: { type: "array", items: { type: "string" } },
      },
    },
    problems: {
      type: "object",
      properties: {
        topIssues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              frequency: { type: "string" },
              priority: { type: "string", enum: ["High", "Medium", "Low"] },
              sentiment: { type: "number" },
            },
          },
        },
        optimizationList: { type: "array", items: { type: "string" } },
      },
    },
    hitProduct: {
      type: "object",
      properties: {
        formula: { type: "string" },
        priceRange: { type: "string" },
        coreFeatures: { type: "array", items: { type: "string" } },
        styleKeywords: { type: "array", items: { type: "string" } },
        sellingPoints: { type: "array", items: { type: "string" } },
      },
    },
    opportunities: {
      type: "object",
      properties: {
        unmetNeeds: { type: "array", items: { type: "string" } },
        newOpportunities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              score: { type: "number" },
              description: { type: "string" },
            },
          },
        },
      },
    },
    directions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          definition: {
            type: "object",
            properties: {
              positioning: { type: "string" },
              targetUser: { type: "string" },
              usp: { type: "array", items: { type: "string" } },
              features: { type: "array", items: { type: "string" } },
              materials: { type: "string" },
              cmf: { type: "string" },
              priceRange: { type: "string" },
              differentiation: { type: "string" },
            },
          },
          designPrompts: {
            type: "object",
            properties: {
              mj: { type: "string" },
              sd: { type: "string" },
              description: { type: "string" },
              cmfSuggestions: { type: "string" },
              structuralSuggestions: { type: "string" },
            },
          },
        },
      },
    },
  },
  required: ["market", "problems", "hitProduct", "opportunities", "directions"],
};

function getAnalysisPrompts(engine, data) {
  const system = `
你是一个集 AI 产品经理、AI 工业设计师、AI 市场分析师于一体的专家系统。
你的任务是执行“AI 爆品决策系统”的六大核心流程：
1. 数据采集：模拟扫描 Amazon、TikTok、Google Trends 等市场信号。
2. 差评分析：深入挖掘用户负面反馈，识别痛点，按频率排序，并评估情感强度。
3. 爆品拆解：拆解当前市场成功产品，总结“功能+价格+风格”的成功公式。
4. 需求挖掘：寻找蓝海市场，发现未被满足的场景、潜在用户群和差异化机会点。
5. 产品定义：基于前述分析，构建 3 个具有竞争力的差异化产品方案。
6. 设计生成：为每个方案提供高清工业设计提示词，包含 CMF 和结构建议。

请使用中文回答所有描述性内容。
输出必须是严格 JSON，不要输出 Markdown，不要解释 JSON 之外的内容。
  `;

  const user = `
请作为 AI 爆品决策专家，使用 ${engine} 引擎深度分析以下产品数据/关键词：
"${data}"

请严格按照六大模块流程进行分析，并输出一份完整、专业、可落地的分析报告。
特别注意：
- 市场分析需包含 Amazon 竞品概览，数据可模拟但要符合真实商业语境。
- 痛点分析需具体且有优先级。
- 产品定义需具备商业可行性和创新性。
- 设计提示词需专业，能够直接用于 Midjourney 或 Stable Diffusion 生成高质量渲染图。
  `;

  return { system, user };
}

function extractJson(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model did not return JSON.");
    return JSON.parse(match[0]);
  }
}

async function callChatCompletions(provider, model, messages, schema) {
  const baseUrl = (provider.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const body = {
    model,
    messages,
    temperature: 0.7,
    response_format: provider.type !== "compatible" && schema
      ? {
          type: "json_schema",
          json_schema: {
            name: "prodintel_response",
            schema,
            strict: false,
          },
        }
      : { type: "json_object" },
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || data.message || "Chat completion request failed.");
  }

  return data.choices?.[0]?.message?.content || "";
}

async function callGeminiJson(provider, model, system, user, schema) {
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  };
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${provider.apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini request failed.");
  }
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
}

async function analyze(body) {
  const provider = resolveProvider(body.providerId);
  const model = body.textModel || provider.defaultTextModel;
  const { system, user } = getAnalysisPrompts(body.engine, body.data);
  let text;

  if (provider.type === "gemini") {
    text = await callGeminiJson(provider, model, system, user, analysisSchema);
  } else {
    text = await callChatCompletions(
      provider,
      model,
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      analysisSchema,
    );
  }

  return { ...extractJson(text), engine: body.engine };
}

async function iterateDesign(body) {
  const provider = resolveProvider(body.providerId);
  const model = body.textModel || provider.defaultTextModel;
  const direction = body.direction;
  const system = "你是资深工业设计总监。请输出严格 JSON，不要输出 Markdown。";
  const user = `
基于上一版产品定义和设计提示词进行迭代：
产品定位：${direction.definition.positioning}
当前 Midjourney 提示词：${direction.designPrompts.mj}
用户反馈："${body.feedback}"

请输出：
{
  "newPrompt": "新的 Midjourney 提示词",
  "rationale": "中文说明为什么这样修改"
}
  `;
  const schema = {
    type: "object",
    properties: {
      newPrompt: { type: "string" },
      rationale: { type: "string" },
    },
    required: ["newPrompt", "rationale"],
  };
  let text;

  if (provider.type === "gemini") {
    text = await callGeminiJson(provider, model, system, user, schema);
  } else {
    text = await callChatCompletions(
      provider,
      model,
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      schema,
    );
  }

  return extractJson(text);
}

async function generateOpenAIImage(provider, model, prompt) {
  const baseUrl = (provider.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt: `Generate a high-quality industrial design product image based on this prompt: ${prompt}. The style should be professional, clean, and realistic.`,
      size: "1024x1024",
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || data.message || "Image generation request failed.");
  }
  const image = data.data?.[0];
  if (image?.b64_json) return `data:image/png;base64,${image.b64_json}`;
  if (image?.url) return image.url;
  throw new Error("No image data returned from provider.");
}

async function generateGeminiImage(provider, model, prompt) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${provider.apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Generate a high-quality industrial design product image based on this prompt: ${prompt}. The style should be professional, clean, and realistic.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: "1:1" },
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini image request failed.");
  }
  const imagePart = data.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
  if (!imagePart?.inlineData?.data) throw new Error("No image data returned from provider.");
  return `data:image/png;base64,${imagePart.inlineData.data}`;
}

async function generateImage(body) {
  const provider = resolveProvider(body.providerId);
  if (!provider.supportsImages) {
    throw new Error(`${provider.label || provider.id} is not configured for image generation.`);
  }

  const model = body.imageModel || provider.defaultImageModel;
  if (!model) {
    throw new Error(`${provider.label || provider.id} is missing an image model.`);
  }

  if (provider.type === "gemini") {
    return { image: await generateGeminiImage(provider, model, body.prompt) };
  }

  return { image: await generateOpenAIImage(provider, model, body.prompt) };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return json(res, 200, { providers: getPublicProviders() });
  }

  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = await readBody(req);
    if (body.action === "analyze") {
      return json(res, 200, { result: await analyze(body) });
    }
    if (body.action === "iterate") {
      return json(res, 200, { result: await iterateDesign(body) });
    }
    if (body.action === "generateImage") {
      return json(res, 200, await generateImage(body));
    }

    return json(res, 400, { error: "Unknown action." });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: error.message || "AI proxy request failed." });
  }
}
