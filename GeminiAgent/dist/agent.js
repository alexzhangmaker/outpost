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
export const thaiArticleSchema = z.object({
    id: z.string().describe('文章唯一标识符 (可以使用 uuid)'),
    title: z.string().describe('文章标题'),
    paragraphs: z.array(z.object({
        paragraph_id: z.string().describe('段落标识符 (如 p1, p2...)'),
        sentences: z.array(z.object({
            thai: z.string().describe('泰文原句'),
            english: z.string().describe('英文翻译'),
            sentence_id: z.string().describe('句子唯一标识 (uuid)'),
            audioURI: z.string().describe('音频路径，初始可为空或占位符'),
        })),
    })),
    words: z.array(z.object({
        thai: z.string().describe('重点单词'),
        definition: z.string().describe('发音与释义'),
    })).optional(),
});
export const thaiWordLearningSchema = z.object({
    word: z.string().describe('输入的泰语单词'),
    audioURL: z.string().optional().describe('单词音频URL'),
    level: z.string().describe('固定值：\'A2 to B1\''),
    translation: z.object({
        chinese: z.string().describe('中文翻译'),
        english: z.string().describe('英文翻译'),
    }),
    phonetic: z.object({
        thai: z.string().describe('泰语拼写，同word'),
        ipa: z.string().describe('IPA国际音标标注'),
    }),
    meanings: z.array(z.object({
        type: z.enum(['literal', 'figurative']).describe('取值：\'literal\' 或 \'figurative\''),
        definition: z.string().describe('中文定义'),
        thai_definition: z.string().describe('泰语定义'),
        keywords: z.array(z.string()).describe('关键词数组'),
        part_of_speech: z.array(z.string()).describe('词性数组，如\'形容词\', \'动词\''),
    })),
    example_sentences: z.array(z.object({
        id: z.number().describe('从1开始的整数'),
        sentence: z.string().describe('泰语例句，确保句中其他词汇主要为A2水平'),
        audioURL: z.string().optional().describe('例句音频URL'),
        translation: z.string().describe('中文翻译'),
        context: z.enum(['literal', 'figurative']).describe('取值：\'literal\' 或 \'figurative\''),
        analysis: z.string().describe('语境分析说明'),
        vocabulary_note: z.string().optional().describe('可选，如有必要解释句中可能出现的稍难词汇'),
    })),
    synonyms: z.array(z.object({
        word: z.string().describe('近义词'),
        audioURL: z.string().optional().describe('近义词音频URL'),
        part_of_speech: z.string().describe('词性'),
        meaning: z.string().describe('中文含义'),
        usage_notes: z.string().describe('用法辨析说明'),
    })),
    antonyms: z.array(z.object({
        word: z.string().describe('反义词'),
        audioURL: z.string().optional().describe('反义词音频URL'),
        part_of_speech: z.string().describe('词性'),
        meaning: z.string().describe('中文含义'),
        usage_notes: z.string().describe('用法说明'),
    })),
    word_family: z.array(z.object({
        form: z.string().describe('派生词形式'),
        audioURL: z.string().optional().describe('派生词音频URL'),
        part_of_speech: z.string().describe('词性'),
        meaning: z.string().describe('中文含义'),
        example: z.object({
            sentence: z.string().describe('泰语例句，确保句中其他词汇主要为A2水平'),
            audioURL: z.string().optional().describe('派生词例句音频URL'),
            translation: z.string().describe('中文翻译'),
        }),
    })),
    exercises: z.array(z.object({
        id: z.number().describe('从1开始的整数'),
        type: z.enum(['context_identification', 'sentence_completion', 'translation_and_reflection', 'paragraph_writing']).describe('练习类型'),
        title: z.string().describe('练习标题'),
        description: z.string().describe('练习说明'),
        questions: z.array(z.object({
            question: z.string().optional().describe('问题文本'),
            sentence: z.string().optional().describe('练习中的泰语句子'),
            audioURL: z.string().optional().describe('练习句子音频URL'),
            options: z.array(z.string()).optional().describe('选择题选项（如适用）'),
            answer: z.string().optional().describe('参考答案或判断标准'),
            explanation: z.string().optional().describe('解析'),
        })).describe('练习题目列表'),
        word_limit: z.string().optional().describe('写作练习的字数限制'),
        prompt: z.string().optional().describe('写作练习的提示'),
    })),
    cultural_notes: z.string().optional().describe('与文化背景相关的说明，不少于50字'),
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
export const THAI_ARTICLE_PROMPT = `**Role:** 你是一位泰语语言学专家，擅长将泰语文章拆分为段落和句子，并提供准确的翻译。

**Task:** 请处理用户提供的泰语文章（Markdown 或 纯文本），将其转换为结构化的 JSON，用于泰语阅读学习应用。

**Instructions:**
1. **结构化拆分**：
   - 将文章拆分为有意义的段落 (\`paragraphs\`)。
   - 每个段落内部按标点或语意将其拆分为独立的句子 (\`sentences\`)。
2. **翻译**：为每个句子提供准确、地道的英文翻译。
3. **元数据**：
   - \`id\`: 请生成一个新的 uuid (如 'f47ac10b-...') 或提取文章中隐含的 ID。
   - \`title\`: 提取或总结文章标题。
   - \`sentence_id\`: 为每个句子生成独立的 uuid。
   - \`audioURI\`: 统一设置为 \`audio/[sentence_id].mp3\`（注意：后缀为 .mp3，与 TTS 输出一致）。
4. **词汇提取**（可选）：提取文章中的 5-10 个关键生词及其泰语发音 and 定义。

**Output Format:** 严格按照提供的 JSON Schema 输出，不包含任何多余解释。`;
export const THAI_WORD_LEARNING_PROMPT = `## 角色设定
你是一位专业的泰语教学专家，擅长为中高级泰语学习者（A2向B1过渡阶段）设计系统性的词汇教学材料。你需要按照指定的JSON格式，为给定的泰语单词生成完整的教学数据。

## 任务描述
为输入的泰语单词生成一个结构化的JSON数据，包含该词的完整教学信息。该JSON将用于语言学习系统，帮助学生从多维度掌握词汇。

## 输入格式
用户将提供一个泰语单词，例如：\`ยืดหยุ่น\`

## 输出要求
必须严格按照提供的 JSON Schema 生成数据，确保字段完整、格式正确、内容准确。

---

## 生成指南

请遵循以下规则生成内容：

### 1. 词义分析 (meanings)
- **literal (本义)**：描述该词的物理属性，指物体的弹性、伸缩性
- **figurative (引申义)**：描述抽象概念，指人的灵活性、变通性，或政策的弹性空间
- **必须同时包含 literal 和 figurative 两个含义**

### 2. 发音标注 (phonetic)
- 使用 **IPA (国际音标)** 标注发音
- 确保标注准确，反映真实发音

### 3. 例句 (example_sentences) - **重要约束**
- 必须包含至少6个例句
- 确保 literal 和 figurative 两种语境的例句均衡分布（各3个左右）
- **核心要求：例句中除了目标词及其派生词外，其他词汇应主要控制在A2水平**
- 避免使用复杂的成语、书面语或高级词汇
- 如有必要使用稍难的词汇（如专业术语），请在 \`vocabulary_note\` 字段中简要解释
- 每个例句需包含：
  - 泰语原文（正确拼写）
  - 中文翻译（准确通顺）
  - context 标注（literal/figurative）
  - analysis 分析（说明例句的语境和用法特点）
  - vocabulary_note（可选，解释句中可能出现的稍难词汇）

### 4. 近义词 (synonyms)
- 至少提供3-4个近义词
- 每个近义词需包含用法辨析说明
- 近义词本身难度可以稍高，但辨析说明要清晰易懂

### 5. 反义词 (antonyms)
- 至少提供3个反义词
- 每个反义词需包含用法说明

### 6. 词族 (word_family)
- 至少提供2个派生词形式（名词形式、副词形式等）
- 每个派生词需配例句
- **派生词例句同样遵循A2词汇为主的原则**

### 7. 练习 (exercises)
必须包含以下4种练习类型：

1. **语境辨识 (context_identification)**：包含 4 个句子，要求判断 literal/figurative.
2. **完成句子 (sentence_completion)**：包含 4 个填空题，用该词或其派生词填空.
3. **翻译与对比 (translation_and_reflection)**：包含 2 个问题（翻译对比、文化思考）.
4. **段落写作 (paragraph_writing)**：提供题目和提示.

所有练习句子同样遵循A2词汇为主的原则。

### 8. 文化注释 (cultural_notes)
- 不少于50字
- 探讨该词与泰国文化、思维方式、社会价值观的关联

---

## 词汇水平参考（A2级别典型词汇）
（此处省略参考表，但在生成时请务必严格控制词汇水平）

---

## 质量检查清单
- 所有必填字段都已填写
- 发音标注使用IPA格式
- 例句数量不少于6个
- 所有例句除目标词外，其他词汇主要控制在A2水平
- 包含全部4种练习类型
- cultural_notes 不少于50字
- JSON 格式正确

---

请为以下泰语单词生成教学材料：`;
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