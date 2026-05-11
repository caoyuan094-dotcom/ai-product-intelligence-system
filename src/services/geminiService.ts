import { GoogleGenAI, Type } from "@google/genai";

export const MODEL_NAME = "gemini-3-flash-preview";
export const API_KEY_STORAGE_KEY = "prodintel-gemini-api-key";

function createAiClient(apiKey: string) {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error("Gemini API key is required.");
  }

  return new GoogleGenAI({ apiKey: trimmedKey });
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
  engine: 'micro' | 'gene' | 'demand';
  market: {
    amazonTopProducts: { title: string; price: string; rating: number; reviews: number }[];
    trends: string;
    tiktokInsights: string[];
  };
  problems: {
    topIssues: { category: string; frequency: string; priority: 'High' | 'Medium' | 'Low'; sentiment: number }[];
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

export async function analyzeProductData(engine: 'micro' | 'gene' | 'demand', data: string, apiKey: string): Promise<AnalysisResult> {
  const ai = createAiClient(apiKey);
  const systemInstructions = `
    你是一个集 AI 产品经理、AI 工业设计师、AI 市场分析师于一体的专家系统。
    你的任务是执行“AI 爆品决策系统”的六大核心流程：
    1. 数据采集 (Data Engine): 模拟扫描 Amazon (Top 20 产品、评论、销量)、TikTok (热门视频趋势)、Google Trends (搜索热度)。
    2. 差评分析 (Problem Engine): 深入挖掘用户负面反馈，识别 TOP 10 痛点，按频率排序，并评估情感强度。
    3. 爆品拆解 (Hit Product Engine): 拆解当前市场最成功的爆品，总结其“功能+价格+风格”的成功公式。
    4. 需求挖掘 (Opportunity Engine): 寻找蓝海市场，发现未被满足的场景、潜在用户群和差异化机会点。
    5. 产品定义 (Product Builder): 基于前述分析，构建 3 个具有极强竞争力的差异化产品方案。
    6. 设计生成 (Design Generator): 为每个方案提供高清工业设计提示词（Midjourney & Stable Diffusion），包含 CMF (颜色、材料、工艺) 和结构建议。

    请使用中文回答所有描述性内容。
    输出必须严格遵守 JSON 模式。
  `;

  const prompt = `
    请作为 AI 爆品决策专家，使用 ${engine} 引擎深度分析以下产品数据/关键词：
    "${data}"
    
    请严格按照六大模块流程进行分析，并输出一份完整、专业、可落地的分析报告。
    特别注意：
    - 市场分析需包含真实的 Amazon 竞品概览（模拟真实数据）。
    - 痛点分析需具体且有优先级。
    - 产品定义需具备商业可行性和创新性。
    - 设计提示词需专业，能够直接用于 Midjourney 生成高质量渲染图。
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: systemInstructions,
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          market: {
            type: Type.OBJECT,
            properties: {
              amazonTopProducts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    price: { type: Type.STRING },
                    rating: { type: Type.NUMBER },
                    reviews: { type: Type.NUMBER }
                  }
                }
              },
              trends: { type: Type.STRING },
              tiktokInsights: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          problems: {
            type: Type.OBJECT,
            properties: {
              topIssues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    frequency: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                    sentiment: { type: Type.NUMBER }
                  }
                }
              },
              optimizationList: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          hitProduct: {
            type: Type.OBJECT,
            properties: {
              formula: { type: Type.STRING },
              priceRange: { type: Type.STRING },
              coreFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
              styleKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              sellingPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          opportunities: {
            type: Type.OBJECT,
            properties: {
              unmetNeeds: { type: Type.ARRAY, items: { type: Type.STRING } },
              newOpportunities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                    description: { type: Type.STRING }
                  }
                }
              }
            }
          },
          directions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                definition: {
                  type: Type.OBJECT,
                  properties: {
                    positioning: { type: Type.STRING },
                    targetUser: { type: Type.STRING },
                    usp: { type: Type.ARRAY, items: { type: Type.STRING } },
                    features: { type: Type.ARRAY, items: { type: Type.STRING } },
                    materials: { type: Type.STRING },
                    cmf: { type: Type.STRING },
                    priceRange: { type: Type.STRING },
                    differentiation: { type: Type.STRING }
                  }
                },
                designPrompts: {
                  type: Type.OBJECT,
                  properties: {
                    mj: { type: Type.STRING },
                    sd: { type: Type.STRING },
                    description: { type: Type.STRING },
                    cmfSuggestions: { type: Type.STRING },
                    structuralSuggestions: { type: Type.STRING }
                  }
                }
              }
            }
          }
        },
        required: ["market", "problems", "hitProduct", "opportunities", "directions"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  return { ...result, engine };
}

export const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";

export async function generateDesignImage(prompt: string, apiKey: string): Promise<string> {
  const ai = createAiClient(apiKey);
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL_NAME,
    contents: {
      parts: [
        {
          text: `Generate a high-quality industrial design product image based on this prompt: ${prompt}. The style should be professional, clean, and realistic.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data returned from model");
}

export async function iterateDesign(
  direction: ProductDirection, 
  feedback: string, 
  apiKey: string,
  currentImage?: string
): Promise<{ newPrompt: string; rationale: string }> {
  const ai = createAiClient(apiKey);
  const prompt = `
    Based on the previous product definition and design:
    Positioning: ${direction.definition.positioning}
    Current Design Prompt: ${direction.designPrompts.mj}
    
    User Feedback: "${feedback}"
    
    Please refine the design prompt to incorporate this feedback while maintaining the core product definition.
    Provide a new Midjourney prompt and a brief rationale in Chinese.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          newPrompt: { type: Type.STRING },
          rationale: { type: Type.STRING }
        },
        required: ["newPrompt", "rationale"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
