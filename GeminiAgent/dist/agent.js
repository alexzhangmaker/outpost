import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();
// Define the schema for image extraction based on user requirements
export const imageExtractionSchema = z.object({
    topic: z.string().describe('图片的主标题或核心语法概念名称'),
    description: z.string().describe('图片中关于该语法概念的泰语原文 definition/解释'),
    comments: z.string().describe('对 description 字段内容的中文翻译与语法要点解析'),
    keywords: z.array(z.string()).describe('提取句型中出现的关键动词或连接词列表'),
    patterns: z.array(z.object({
        format: z.string().describe('句型结构公式（如：นามวลี + ...）'),
        examples: z.array(z.object({
            thai: z.string().describe('完整的泰语示例句子'),
            english: z.string().describe('该示例句子的准确英文翻译'),
        })),
    })).describe('确保包含图片中展示的所有 Pattern 和 Example'),
});
const THAI_VISION_PROMPT = `**Role:** 你是一位精通泰语、中文和英语的语言学专家，擅长将泰语教学材料转换为结构化的 JSON 数据。

**Task:** 请分析上传的图片，提取其中的泰语句型教学内容，并严格按照提供的 JSON 格式输出。

**Instructions & Constraints:**

1. **精准提取**：准确识别图片中的泰语文字。语法术语（如 นามวลี, กริยาวลี）在 \`format\` 字段中请保留泰语原文。
2. **多语言处理**：
* \`description\`: 必须是图片中的**泰语原文**。
* \`comments\`: 将上述定义翻译为**中文**，并简要说明该语法的核心逻辑。
* \`english\`: 为每个示例提供地道的**英文**翻译。

3. **格式规范**：输出必须是严格 of JSON 格式。
4. **数据完整**：确保包含图片中展示的所有 Pattern 和 Example.`;
export const geminiAgent = new Agent({
    id: 'GeminiAgent',
    name: 'GeminiAgent',
    instructions: THAI_VISION_PROMPT,
    model: {
        id: 'google/gemini-2.0-flash',
    },
});
export const mastra = new Mastra({
    agents: { geminiAgent },
});
//# sourceMappingURL=agent.js.map