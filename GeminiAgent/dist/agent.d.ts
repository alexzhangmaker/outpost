import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core';
import { z } from 'zod';
export declare const imageExtractionSchema: z.ZodObject<{
    topic: z.ZodString;
    description: z.ZodString;
    comments: z.ZodString;
    keywords: z.ZodArray<z.ZodString, "many">;
    patterns: z.ZodArray<z.ZodObject<{
        format: z.ZodString;
        usage: z.ZodOptional<z.ZodString>;
        examples: z.ZodArray<z.ZodObject<{
            thai: z.ZodString;
            english: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            thai: string;
            english: string;
        }, {
            thai: string;
            english: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        format: string;
        examples: {
            thai: string;
            english: string;
        }[];
        usage?: string | undefined;
    }, {
        format: string;
        examples: {
            thai: string;
            english: string;
        }[];
        usage?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    topic: string;
    description: string;
    comments: string;
    keywords: string[];
    patterns: {
        format: string;
        examples: {
            thai: string;
            english: string;
        }[];
        usage?: string | undefined;
    }[];
}, {
    topic: string;
    description: string;
    comments: string;
    keywords: string[];
    patterns: {
        format: string;
        examples: {
            thai: string;
            english: string;
        }[];
        usage?: string | undefined;
    }[];
}>;
export declare const commonSentencesSchema: z.ZodObject<{
    title: z.ZodString;
    introduction: z.ZodString;
    sections: z.ZodArray<z.ZodObject<{
        sectionTitle: z.ZodString;
        sectionDescription: z.ZodString;
        categories: z.ZodArray<z.ZodObject<{
            categoryTitle: z.ZodString;
            categorySubtitle: z.ZodString;
            sentences: z.ZodArray<z.ZodObject<{
                thai: z.ZodString;
                chinese: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                thai: string;
                chinese: string;
            }, {
                thai: string;
                chinese: string;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            categoryTitle: string;
            categorySubtitle: string;
            sentences: {
                thai: string;
                chinese: string;
            }[];
        }, {
            categoryTitle: string;
            categorySubtitle: string;
            sentences: {
                thai: string;
                chinese: string;
            }[];
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        sectionTitle: string;
        sectionDescription: string;
        categories: {
            categoryTitle: string;
            categorySubtitle: string;
            sentences: {
                thai: string;
                chinese: string;
            }[];
        }[];
    }, {
        sectionTitle: string;
        sectionDescription: string;
        categories: {
            categoryTitle: string;
            categorySubtitle: string;
            sentences: {
                thai: string;
                chinese: string;
            }[];
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    title: string;
    introduction: string;
    sections: {
        sectionTitle: string;
        sectionDescription: string;
        categories: {
            categoryTitle: string;
            categorySubtitle: string;
            sentences: {
                thai: string;
                chinese: string;
            }[];
        }[];
    }[];
}, {
    title: string;
    introduction: string;
    sections: {
        sectionTitle: string;
        sectionDescription: string;
        categories: {
            categoryTitle: string;
            categorySubtitle: string;
            sentences: {
                thai: string;
                chinese: string;
            }[];
        }[];
    }[];
}>;
export declare const MARKDOWN_EXTRACTION_PROMPT = "# Role: \u7ED3\u6784\u5316\u6570\u636E\u8F6C\u6362\u4E13\u5BB6\n\n\u4F60\u662F\u4E00\u4F4D\u7CBE\u901A\u6587\u6863\u5206\u6790\u548C\u7ED3\u6784\u5316\u6570\u636E\u8F6C\u6362\u7684\u4E13\u5BB6\uFF0C\u64C5\u957F\u5C06\u683C\u5F0F\u5316\u7684Markdown\u6559\u5B66\u5185\u5BB9\u6574\u7406\u4E3A\u6E05\u6670\u3001\u5B8C\u6574\u7684JSON\u6570\u636E\u3002\n\n# Task:\n\n\u8BF7\u4ED4\u7EC6\u5206\u6790\u7528\u6237\u63D0\u4F9B\u7684Markdown\u6587\u6863\u5185\u5BB9\uFF0C\u63D0\u53D6\u5176\u4E2D\u7684\u8BED\u8A00\u6559\u5B66\u8981\u70B9\uFF0C\u5E76\u4E25\u683C\u6309\u7167\u6307\u5B9A\u7684JSON Schema\u683C\u5F0F\u8FDB\u884C\u8F93\u51FA\u8F6C\u6362\u3002\n\n# Output JSON Schema:\n\n```json\n{\n  \"topic\": \"\u6587\u6863\u7684\u6838\u5FC3\u4E3B\u9898\u6216\u6807\u9898\",\n  \"description\": \"\u6587\u6863\u4E2D\u5173\u4E8E\u8BE5\u4E3B\u9898\u7684\u539F\u6587\u63CF\u8FF0/\u4ECB\u7ECD\",\n  \"comments\": \"\u5BF9description\u5B57\u6BB5\u5185\u5BB9\u7684\u4E2D\u6587\u7FFB\u8BD1\u4E0E\u5185\u5BB9\u8981\u70B9\u89E3\u6790\",\n  \"keywords\": [\"\u4ECE\u6587\u6863\u5185\u5BB9\u4E2D\u63D0\u53D6\u7684\u5173\u952E\u8BCD\u6216\u672F\u8BED\u5217\u8868\"],\n  \"patterns\": [\n    {\n      \"format\": \"\u53E5\u578B\u7ED3\u6784\u6216\u516C\u5F0F\uFF08\u4FDD\u7559\u539F\u6587\u8BED\u8A00\uFF09\",\n      \"usage\": \"\u8BE5\u53E5\u578B\u7684\u7528\u9014\u6216\u7528\u6CD5\u8BF4\u660E\",\n      \"examples\": [\n        {\n          \"thai\": \"\u5B8C\u6574\u7684\u6CF0\u8BED\u793A\u4F8B\u53E5\u5B50\",\n          \"english\": \"\u8BE5\u793A\u4F8B\u53E5\u5B50\u7684\u51C6\u786E\u82F1\u6587\u7FFB\u8BD1\"\n        }\n      ]\n    }\n  ]\n}\n```\n\n# Instructions & Constraints:\n\n1. **\u5185\u5BB9\u63D0\u53D6**\uFF1A\n   - \u51C6\u786E\u8BC6\u522B\u6587\u6863\u4E2D\u7684\u6838\u5FC3\u6559\u5B66\u5185\u5BB9\u548C\u7ED3\u6784\n   - `topic`\u5B57\u6BB5\u63D0\u53D6\u6587\u6863\u7684\u4E3B\u6807\u9898\u6216\u6838\u5FC3\u4E3B\u9898\n   - `description`\u5B57\u6BB5\u4F7F\u7528\u6587\u6863\u4E2D\u7684**\u539F\u6587\u63CF\u8FF0**\uFF08\u901A\u5E38\u662F\u5F00\u5934\u7684\u6982\u8FF0\u6BB5\u843D\uFF09\n   - `patterns`\u6570\u7EC4\u9700\u5305\u542B\u6587\u6863\u4E2D\u5C55\u793A\u7684\u6240\u6709\u53E5\u578B\u6A21\u5F0F\n\n2. **\u591A\u5B57\u6BB5\u5904\u7406**\uFF1A\n   - `comments`: \u5C06description\u7FFB\u8BD1\u4E3A**\u4E2D\u6587**\uFF0C\u5E76\u7B80\u8981\u8BF4\u660E\u6587\u6863\u7684\u6838\u5FC3\u5185\u5BB9\u4E0E\u6559\u5B66\u903B\u8F91\n   - `keywords`: \u4ECE\u6587\u6863\u7684\u53E5\u578B\u3001\u6807\u9898\u548C\u5185\u5BB9\u4E2D\u63D0\u53D6\u6700\u5177\u4EE3\u8868\u6027\u7684\u5173\u952E\u8BCD\n   - \u6BCF\u4E2A`pattern`\u5FC5\u987B\u5305\u542B`format`\uFF08\u53E5\u578B\u7ED3\u6784\uFF09\u3001`usage`\uFF08\u7528\u9014\u7528\u6CD5\uFF09\u548C`examples`\uFF08\u4F8B\u53E5\uFF09\u4E09\u4E2A\u5B50\u5B57\u6BB5\n\n3. **\u6570\u636E\u5B8C\u6574\u6027**\uFF1A\n   - \u786E\u4FDD\u63D0\u53D6\u6587\u6863\u4E2D\u6240\u6709\u5C55\u793A\u7684\u53E5\u578B\u6A21\u5F0F\n   - \u6BCF\u4E2A\u53E5\u578B\u7684`usage`\u5B57\u6BB5\u5FC5\u987B\u4ECE\u539F\u6587\u4E2D\u63D0\u53D6\u5BF9\u5E94\u7684\"\u7528\u9014\u7528\u6CD5\"\u63CF\u8FF0\n   - `examples`\u6570\u7EC4\u4E2D\u7684\u6BCF\u4E2A\u4F8B\u53E5\u5FC5\u987B\u5305\u542B\u539F\u6587\u548C\u5BF9\u5E94\u7684\u82F1\u6587\u7FFB\u8BD1\n\n4. **\u683C\u5F0F\u89C4\u8303**\uFF1A\n   - \u8F93\u51FA\u5FC5\u987B\u662F\u4E25\u683C\u3001\u6709\u6548\u7684JSON\u683C\u5F0F\n   - \u4E0D\u5305\u542B\u4EFB\u4F55JSON\u683C\u5F0F\u5757\u4EE5\u5916\u7684\u89E3\u91CA\u6216\u989D\u5916\u6587\u5B57\n   - \u4FDD\u6301\u539F\u6587\u7684\u8BED\u8A00\u672F\u8BED\u548C\u683C\u5F0F\uFF08\u5982\u6CF0\u8BED\u8BED\u6CD5\u672F\u8BED\u4E0D\u7FFB\u8BD1\uFF09\n\n5. **\u7279\u6B8A\u8981\u6C42**\uFF1A\n   - \u5982\u539F\u6587\u4F7F\u7528\u8868\u683C\u5F62\u5F0F\u7EC4\u7EC7\u5185\u5BB9\uFF0C\u9700\u6B63\u786E\u8BC6\u522B\u8868\u683C\u4E2D\u7684\"\u5E38\u7528\u53E5\u578B\"\u3001\"\u7528\u9014\u7528\u6CD5\"\u3001\"\u5178\u578B\u4F8B\u53E5\"\u4E09\u5217\n   - \u786E\u4FDD\u53E5\u578B\u516C\u5F0F\u4E2D\u7684\u5360\u4F4D\u7B26\uFF08\u5982`...`\u3001`[\u59D3\u540D]`\uFF09\u5728format\u5B57\u6BB5\u4E2D\u5B8C\u6574\u4FDD\u7559\n   - \u4F8B\u53E5\u4E2D\u7684\u6CF0\u8BED\u6807\u70B9\u7B26\u53F7\u9700\u6B63\u786E\u5904\u7406\n\n# \u5904\u7406\u6D41\u7A0B\u63D0\u793A\uFF1A\n\n1. \u9996\u5148\u8BC6\u522B\u6587\u6863\u7684\u6574\u4F53\u7ED3\u6784\u548C\u4E3B\u9898\n2. \u63D0\u53D6\u6240\u6709\u53E5\u578B\u90E8\u5206\uFF0C\u6309\u539F\u6587\u987A\u5E8F\u6574\u7406\n3. \u4E3A\u6BCF\u4E2A\u53E5\u578B\u5339\u914D\u5BF9\u5E94\u7684\u7528\u9014\u8BF4\u660E\u548C\u4F8B\u53E5\n4. \u4ECE\u6574\u4F53\u5185\u5BB9\u4E2D\u63D0\u70BC\u5173\u952E\u8BCD\n5. \u6784\u5EFA\u5B8C\u6574\u7684JSON\u7ED3\u6784\n\n\u8BF7\u4E25\u683C\u6309\u7167\u4E0A\u8FF0\u8981\u6C42\u5904\u7406\u8F93\u5165\u7684Markdown\u6587\u6863\uFF0C\u8F93\u51FA\u7EAF\u51C0\u7684JSON\u6570\u636E\u3002";
export declare const COMMON_SENTENCES_PROMPT = "## \u80CC\u666F\n\u4F60\u662F\u4E00\u4E2A\u7ED3\u6784\u5316\u6570\u636E\u5904\u7406\u4E13\u5BB6\u3002\u4F60\u7684\u4EFB\u52A1\u662F\u6839\u636E\u7528\u6237\u63D0\u4F9B\u7684\u6587\u6863\u5185\u5BB9\uFF0C\u63D0\u53D6\u5173\u952E\u4FE1\u606F\u5E76\u6309\u7167\u6307\u5B9A\u7684JSON schema\u751F\u6210\u7ED3\u6784\u5316\u7684\u6570\u636E\u3002\n\n## \u8F93\u5165\n\u7528\u6237\u5C06\u63D0\u4F9B\u5305\u542B\u4EE5\u4E0B\u4FE1\u606F\u7684\u6587\u6863\uFF1A\n1. \u6587\u6863\u6807\u9898\n2. \u6587\u6863\u7B80\u4ECB/\u6982\u8FF0\n3. \u591A\u4E2A\u5185\u5BB9\u5206\u7EC4\uFF0C\u6BCF\u4E2A\u5206\u7EC4\u5305\u542B\uFF1A\n   - \u5206\u7EC4\u6807\u9898\n   - \u5206\u7EC4\u63CF\u8FF0\n   - \u82E5\u5E72\u4E2A\u5B50\u7C7B\u522B\uFF0C\u6BCF\u4E2A\u5B50\u7C7B\u522B\u5305\u542B\uFF1A\n     - \u5B50\u7C7B\u522B\u6807\u9898\n     - \u5B50\u7C7B\u522B\u526F\u6807\u9898\uFF08\u901A\u5E38\u4E3A\u6CF0\u8BED\u540D\u79F0\uFF09\n     - \u591A\u4E2A\u53E5\u5B50\u6761\u76EE\uFF0C\u6BCF\u4E2A\u6761\u76EE\u5305\u542B\u6CF0\u8BED\u548C\u4E2D\u6587\u6587\u672C\n\n## \u8F93\u51FA\u8981\u6C42\n\n### 1. JSON\u7ED3\u6784\n\u4F60\u5FC5\u987B\u8F93\u51FA\u4E00\u4E2A\u7B26\u5408\u4EE5\u4E0Bschema\u7684JSON\u5BF9\u8C61\uFF1A\n\n```json\n{\n  \"title\": \"string - \u6587\u6863\u6807\u9898\",\n  \"introduction\": \"string - \u6587\u6863\u7B80\u4ECB\",\n  \"sections\": [\n    {\n      \"sectionTitle\": \"string - \u5206\u7EC4\u6807\u9898\",\n      \"sectionDescription\": \"string - \u5206\u7EC4\u63CF\u8FF0\",\n      \"categories\": [\n        {\n          \"categoryTitle\": \"string - \u5B50\u7C7B\u522B\u6807\u9898\uFF08\u4E2D\u6587\uFF09\",\n          \"categorySubtitle\": \"string - \u5B50\u7C7B\u522B\u526F\u6807\u9898\uFF08\u6CF0\u8BED\uFF0C\u5305\u542B\u62EC\u53F7\uFF09\",\n          \"sentences\": [\n            {\n              \"thai\": \"string - \u6CF0\u8BED\u53E5\u5B50\",\n              \"chinese\": \"string - \u4E2D\u6587\u7FFB\u8BD1\"\n            }\n          ]\n        }\n      ]\n    }\n  ]\n}\n```\n\n### 2. \u5185\u5BB9\u63D0\u53D6\u89C4\u5219\n1. **\u6807\u9898\u63D0\u53D6**\uFF1A\u4ECE\u6587\u6863\u6700\u9876\u90E8\u7684\u6807\u9898\uFF08\u901A\u5E38\u4EE5##\u5F00\u5934\uFF09\u4E2D\u63D0\u53D6\n2. **\u7B80\u4ECB\u63D0\u53D6**\uFF1A\u4ECE\u6807\u9898\u4E0B\u65B9\u7684\u63CF\u8FF0\u6027\u6BB5\u843D\u4E2D\u63D0\u53D6\n3. **\u5206\u7EC4\u8BC6\u522B**\uFF1A\u6BCF\u4E2A\u4E3B\u8981\u5206\u7EC4\u4EE5##\u5F00\u5934\uFF0C\u5305\u542B\u5206\u7EC4\u6807\u9898\u548C\u63CF\u8FF0\n4. **\u5B50\u7C7B\u522B\u8BC6\u522B**\uFF1A\u5B50\u7C7B\u522B\u4EE5###\u6216\u5217\u8868\u9879\u5F62\u5F0F\u51FA\u73B0\uFF0C\u901A\u5E38\u5305\u542B\u6807\u9898\u548C\u526F\u6807\u9898\n5. **\u53E5\u5B50\u63D0\u53D6**\uFF1A\n   - \u6BCF\u4E2A\u53E5\u5B50\u6761\u76EE\u901A\u5E38\u4EE5\u6570\u5B57\u5E8F\u53F7\u5F00\u5934\n   - \u6CF0\u8BED\u90E8\u5206\u4E3A\u53E5\u5B50\u672C\u8EAB\n   - \u4E2D\u6587\u90E8\u5206\u5728\u6CF0\u8BED\u4E0B\u65B9\uFF0C\u4EE5\u62EC\u53F7\u5305\u88F9\n   - \u4FDD\u6301\u539F\u6587\u683C\u5F0F\uFF0C\u4E0D\u6DFB\u52A0\u989D\u5916\u5185\u5BB9\n\n### 3. \u683C\u5F0F\u8981\u6C42\n1. \u4E25\u683C\u9075\u5FAAJSON\u683C\u5F0F\uFF0C\u786E\u4FDD\u6709\u6548\u7684JSON\u8BED\u6CD5\n2. \u6240\u6709\u5B57\u7B26\u4E32\u4F7F\u7528\u53CC\u5F15\u53F7\n3. \u6570\u7EC4\u548C\u5BF9\u8C61\u4FDD\u6301\u6B63\u786E\u7684\u7F29\u8FDB\u5C42\u7EA7\n4. \u4E0D\u8981\u5305\u542B\u4EFB\u4F55JSON\u4E4B\u5916\u7684\u6587\u672C\u3001\u89E3\u91CA\u6216markdown\u683C\u5F0F\n5. \u5982\u679C\u67D0\u4E9B\u5B57\u6BB5\u5728\u6587\u6863\u4E2D\u7F3A\u5931\uFF0C\u53EF\u4EE5\u4F7F\u7528\u7A7A\u5B57\u7B26\u4E32\u6216\u9002\u5F53\u63A8\u65AD\n\n### 4. \u6570\u636E\u6E05\u6D17\u89C4\u5219\n1. \u79FB\u9664\u53E5\u5B50\u524D\u7684\u6570\u5B57\u5E8F\u53F7\u548C\u6807\u70B9\uFF08\u59821. **\u3001**\uFF09\n2. \u4FDD\u6301\u6CF0\u8BED\u539F\u6587\u7684\u5B8C\u6574\u6027\u548C\u6807\u70B9\u7B26\u53F7\n3. \u4E2D\u6587\u7FFB\u8BD1\u4FDD\u7559\u4F46\u79FB\u9664\u62EC\u53F7\uFF08()\u6216\uFF08\uFF09\uFF09\n4. \u6807\u9898\u548C\u63CF\u8FF0\u4E2D\u7684markdown\u6807\u8BB0\uFF08\u5982**\u3001\uD83D\uDCD8\u7B49\uFF09\u53EF\u4EE5\u79FB\u9664\n\n### 5. \u9A8C\u8BC1\u68C0\u67E5\n\u5728\u8F93\u51FA\u524D\u8BF7\u786E\u4FDD\uFF1A\n- [ ] JSON\u8BED\u6CD5\u6B63\u786E\uFF0C\u53EF\u4EE5\u901A\u8FC7JSON\u89E3\u6790\u5668\u9A8C\u8BC1\n- [ ] \u6240\u6709\u5FC5\u586B\u5B57\u6BB5\u90FD\u5B58\u5728\n- [ ] \u6570\u7EC4\u957F\u5EA6\u4E0E\u5B9E\u9645\u6761\u76EE\u6570\u4E00\u81F4\n- [ ] \u6CA1\u6709\u4E22\u5931\u4EFB\u4F55\u6587\u6863\u4E2D\u7684\u91CD\u8981\u5185\u5BB9\n- [ ] \u6570\u636E\u7C7B\u578B\u7B26\u5408schema\u8981\u6C42\n\n## \u5904\u7406\u6D41\u7A0B\u63D0\u793A\uFF1A\n\n1. \u9996\u5148\u8BC6\u522B\u6587\u6863\u7684\u6574\u4F53\u7ED3\u6784\u548C\u4E3B\u9898\n2. \u63D0\u53D6\u6240\u6709\u53E5\u578B\u90E8\u5206\uFF0C\u6309\u539F\u6587\u987A\u5E8F\u6574\u7406\n3. \u4E3A\u6BCF\u4E2A\u53E5\u578B\u5339\u914D\u5BF9\u5E94\u7684\u7528\u9014\u8BF4\u660E\u548C\u4F8B\u53E5\n4. \u4ECE\u6574\u4F53\u5185\u5BB9\u4E2D\u63D0\u70BC\u5173\u952E\u8BCD\n5. \u6784\u5EFA\u5B8C\u6574\u7684JSON\u7ED3\u6784\n\n\u8BF7\u4E25\u683C\u6309\u7167\u4E0A\u8FF0\u8981\u6C42\u5904\u7406\u8F93\u5165\u7684Markdown\u6587\u6863\uFF0C\u8F93\u51FA\u7EAF\u51C0\u7684JSON\u6570\u636E\u3002";
export declare const geminiAgent: Agent<"GeminiAgent", import("@mastra/core/agent").ToolsInput, undefined, unknown>;
export declare const mastra: Mastra<{
    geminiAgent: Agent<"GeminiAgent", import("@mastra/core/agent").ToolsInput, undefined, unknown>;
}, Record<string, import("@mastra/core").Workflow<any, any, any, any, any, any, any, unknown>>, Record<string, import("@mastra/core").MastraVectorProvider<any>>, Record<string, import("@mastra/core/dist/tts").MastraTTS>, import("@mastra/core").Logger, Record<string, import("@mastra/core/dist/mcp").MCPServerBase<any>>, Record<string, import("@mastra/core/dist/evals").MastraScorer<any, any, any, any>>, Record<string, import("@mastra/core").ToolAction<any, any, any, any, any, any, unknown>>, Record<string, import("@mastra/core/dist/processors").Processor<any, unknown>>, Record<string, import("@mastra/core").MastraMemory>>;
//# sourceMappingURL=agent.d.ts.map