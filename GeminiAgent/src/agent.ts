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
        usage: z.string().optional().describe('该句型的用途或用法说明'),
        examples: z.array(z.object({
            thai: z.string().describe('完整的泰语示例句子'),
            english: z.string().describe('该示例句子的准确英文翻译'),
        })),
    })).describe('确保包含展示的所有 Pattern 和 Example'),
});

export const commonSentencesSchema = z.object({
    title: z.string().describe('文档标题'),
    introduction: z.string().describe('文档简介/概述'),
    sections: z.array(z.object({
        sectionTitle: z.string().describe('分组标题'),
        sectionDescription: z.string().describe('分组描述'),
        categories: z.array(z.object({
            categoryTitle: z.string().describe('子类别标题（中文）'),
            categorySubtitle: z.string().describe('子类别副标题（泰语）'),
            sentences: z.array(z.object({
                thai: z.string().describe('泰语句子'),
                chinese: z.string().describe('中文翻译'),
            })),
        })),
    })),
});

const THAI_VISION_PROMPT = `**Role:** 你是一位精通泰语、中文和英语的语言学专家，擅长将泰语教学材料转换为结构化的 JSON 数据。

**Task:** 请分析上传的图片，提取其中的泰语句型教学内容，并严格按照提供的 JSON 格式输出。

**Instructions & Constraints:**

1. **全面扫描**：从上到下完整扫描整张图片。**不要**因为看到水平分割线、页面底部页码或页眉页脚而停止提取。
2. **多句型提取**：图片中可能包含多个句型（如 2.1, 2.2, 2.3 等）。必须将所有识别到的句型提取并放入 \`patterns\` 数组中。
3. **精准提取**：准确识别泰语文字。语法术语在 \`format\` 字段中请保留泰语原文。
4. **多语言处理**：
   * \`description\`: 必须是图片中的**泰语原文**定义。
   * \`comments\`: 将上述定义翻译为**中文**，并简要说明语法逻辑。
   * \`english\`: 为每个示例提供地道的**英文**翻译。
5. **格式规范**：输出必须是严格的 JSON 格式。确保数据完整，不遗漏任何可见的 Pattern 或 Example.`;

export const MARKDOWN_EXTRACTION_PROMPT = `# Role: 结构化数据转换专家

你是一位精通文档分析和结构化数据转换的专家，擅长将格式化的Markdown教学内容整理为清晰、完整的JSON数据。

# Task:

请仔细分析用户提供的Markdown文档内容，提取其中的语言教学要点，并严格按照指定的JSON Schema格式进行输出转换。

# Output JSON Schema:

\`\`\`json
{
  "topic": "文档的核心主题或标题",
  "description": "文档中关于该主题的原文描述/介绍",
  "comments": "对description字段内容的中文翻译与内容要点解析",
  "keywords": ["从文档内容中提取的关键词或术语列表"],
  "patterns": [
    {
      "format": "句型结构或公式（保留原文语言）",
      "usage": "该句型的用途或用法说明",
      "examples": [
        {
          "thai": "完整的泰语示例句子",
          "english": "该示例句子的准确英文翻译"
        }
      ]
    }
  ]
}
\`\`\`

# Instructions & Constraints:

1. **内容提取**：
   - 准确识别文档中的核心教学内容和结构
   - \`topic\`字段提取文档的主标题或核心主题
   - \`description\`字段使用文档中的**原文描述**（通常是开头的概述段落）
   - \`patterns\`数组需包含文档中展示的所有句型模式

2. **多字段处理**：
   - \`comments\`: 将description翻译为**中文**，并简要说明文档的核心内容与教学逻辑
   - \`keywords\`: 从文档的句型、标题和内容中提取最具代表性的关键词
   - 每个\`pattern\`必须包含\`format\`（句型结构）、\`usage\`（用途用法）和\`examples\`（例句）三个子字段

3. **数据完整性**：
   - 确保提取文档中所有展示的句型模式
   - 每个句型的\`usage\`字段必须从原文中提取对应的"用途用法"描述
   - \`examples\`数组中的每个例句必须包含原文和对应的英文翻译

4. **格式规范**：
   - 输出必须是严格、有效的JSON格式
   - 不包含任何JSON格式块以外的解释或额外文字
   - 保持原文的语言术语和格式（如泰语语法术语不翻译）

5. **特殊要求**：
   - 如原文使用表格形式组织内容，需正确识别表格中的"常用句型"、"用途用法"、"典型例句"三列
   - 确保句型公式中的占位符（如\`...\`、\`[姓名]\`）在format字段中完整保留
   - 例句中的泰语标点符号需正确处理

# 处理流程提示：

1. 首先识别文档的整体结构和主题
2. 提取所有句型部分，按原文顺序整理
3. 为每个句型匹配对应的用途说明和例句
4. 从整体内容中提炼关键词
5. 构建完整的JSON结构

请严格按照上述要求处理输入的Markdown文档，输出纯净的JSON数据。`;

export const COMMON_SENTENCES_PROMPT = `## 背景
你是一个结构化数据处理专家。你的任务是根据用户提供的文档内容，提取关键信息并按照指定的JSON schema生成结构化的数据。

## 输入
用户将提供包含以下信息的文档：
1. 文档标题
2. 文档简介/概述
3. 多个内容分组，每个分组包含：
   - 分组标题
   - 分组描述
   - 若干个子类别，每个子类别包含：
     - 子类别标题
     - 子类别副标题（通常为泰语名称）
     - 多个句子条目，每个条目包含泰语和中文文本

## 输出要求

### 1. JSON结构
你必须输出一个符合以下schema的JSON对象：

\`\`\`json
{
  "title": "string - 文档标题",
  "introduction": "string - 文档简介",
  "sections": [
    {
      "sectionTitle": "string - 分组标题",
      "sectionDescription": "string - 分组描述",
      "categories": [
        {
          "categoryTitle": "string - 子类别标题（中文）",
          "categorySubtitle": "string - 子类别副标题（泰语，包含括号）",
          "sentences": [
            {
              "thai": "string - 泰语句子",
              "chinese": "string - 中文翻译"
            }
          ]
        }
      ]
    }
  ]
}
\`\`\`

### 2. 内容提取规则
1. **标题提取**：从文档最顶部的标题（通常以##开头）中提取
2. **简介提取**：从标题下方的描述性段落中提取
3. **分组识别**：每个主要分组以##开头，包含分组标题和描述
4. **子类别识别**：子类别以###或列表项形式出现，通常包含标题和副标题
5. **句子提取**：
   - 每个句子条目通常以数字序号开头
   - 泰语部分为句子本身
   - 中文部分在泰语下方，以括号包裹
   - 保持原文格式，不添加额外内容

### 3. 格式要求
1. 严格遵循JSON格式，确保有效的JSON语法
2. 所有字符串使用双引号
3. 数组和对象保持正确的缩进层级
4. 不要包含任何JSON之外的文本、解释或markdown格式
5. 如果某些字段在文档中缺失，可以使用空字符串或适当推断

### 4. 数据清洗规则
1. 移除句子前的数字序号和标点（如1. **、**）
2. 保持泰语原文的完整性和标点符号
3. 中文翻译保留但移除括号（()或（））
4. 标题和描述中的markdown标记（如**、📘等）可以移除

### 5. 验证检查
在输出前请确保：
- [ ] JSON语法正确，可以通过JSON解析器验证
- [ ] 所有必填字段都存在
- [ ] 数组长度与实际条目数一致
- [ ] 没有丢失任何文档中的重要内容
- [ ] 数据类型符合schema要求

## 处理流程提示：

1. 首先识别文档的整体结构和主题
2. 提取所有句型部分，按原文顺序整理
3. 为每个句型匹配对应的用途说明和例句
4. 从整体内容中提炼关键词
5. 构建完整的JSON结构

请严格按照上述要求处理输入的Markdown文档，输出纯净的JSON数据。`;

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
