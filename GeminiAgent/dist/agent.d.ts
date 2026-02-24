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
export declare const thaiArticleSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    paragraphs: z.ZodArray<z.ZodObject<{
        paragraph_id: z.ZodString;
        sentences: z.ZodArray<z.ZodObject<{
            thai: z.ZodString;
            english: z.ZodString;
            sentence_id: z.ZodString;
            audioURI: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            thai: string;
            english: string;
            sentence_id: string;
            audioURI: string;
        }, {
            thai: string;
            english: string;
            sentence_id: string;
            audioURI: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        sentences: {
            thai: string;
            english: string;
            sentence_id: string;
            audioURI: string;
        }[];
        paragraph_id: string;
    }, {
        sentences: {
            thai: string;
            english: string;
            sentence_id: string;
            audioURI: string;
        }[];
        paragraph_id: string;
    }>, "many">;
    words: z.ZodOptional<z.ZodArray<z.ZodObject<{
        thai: z.ZodString;
        definition: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        thai: string;
        definition: string;
    }, {
        thai: string;
        definition: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    id: string;
    paragraphs: {
        sentences: {
            thai: string;
            english: string;
            sentence_id: string;
            audioURI: string;
        }[];
        paragraph_id: string;
    }[];
    words?: {
        thai: string;
        definition: string;
    }[] | undefined;
}, {
    title: string;
    id: string;
    paragraphs: {
        sentences: {
            thai: string;
            english: string;
            sentence_id: string;
            audioURI: string;
        }[];
        paragraph_id: string;
    }[];
    words?: {
        thai: string;
        definition: string;
    }[] | undefined;
}>;
export declare const thaiWordLearningSchema: z.ZodObject<{
    word: z.ZodString;
    level: z.ZodString;
    translation: z.ZodObject<{
        chinese: z.ZodString;
        english: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        english: string;
        chinese: string;
    }, {
        english: string;
        chinese: string;
    }>;
    phonetic: z.ZodObject<{
        thai: z.ZodString;
        ipa: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        thai: string;
        ipa: string;
    }, {
        thai: string;
        ipa: string;
    }>;
    meanings: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["literal", "figurative"]>;
        definition: z.ZodString;
        thai_definition: z.ZodString;
        keywords: z.ZodArray<z.ZodString, "many">;
        part_of_speech: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "literal" | "figurative";
        keywords: string[];
        definition: string;
        thai_definition: string;
        part_of_speech: string[];
    }, {
        type: "literal" | "figurative";
        keywords: string[];
        definition: string;
        thai_definition: string;
        part_of_speech: string[];
    }>, "many">;
    example_sentences: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        sentence: z.ZodString;
        translation: z.ZodString;
        context: z.ZodEnum<["literal", "figurative"]>;
        analysis: z.ZodString;
        vocabulary_note: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        translation: string;
        sentence: string;
        context: "literal" | "figurative";
        analysis: string;
        vocabulary_note?: string | undefined;
    }, {
        id: number;
        translation: string;
        sentence: string;
        context: "literal" | "figurative";
        analysis: string;
        vocabulary_note?: string | undefined;
    }>, "many">;
    synonyms: z.ZodArray<z.ZodObject<{
        word: z.ZodString;
        part_of_speech: z.ZodString;
        meaning: z.ZodString;
        usage_notes: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        word: string;
        part_of_speech: string;
        meaning: string;
        usage_notes: string;
    }, {
        word: string;
        part_of_speech: string;
        meaning: string;
        usage_notes: string;
    }>, "many">;
    antonyms: z.ZodArray<z.ZodObject<{
        word: z.ZodString;
        part_of_speech: z.ZodString;
        meaning: z.ZodString;
        usage_notes: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        word: string;
        part_of_speech: string;
        meaning: string;
        usage_notes: string;
    }, {
        word: string;
        part_of_speech: string;
        meaning: string;
        usage_notes: string;
    }>, "many">;
    word_family: z.ZodArray<z.ZodObject<{
        form: z.ZodString;
        part_of_speech: z.ZodString;
        meaning: z.ZodString;
        example: z.ZodObject<{
            sentence: z.ZodString;
            translation: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            translation: string;
            sentence: string;
        }, {
            translation: string;
            sentence: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        part_of_speech: string;
        meaning: string;
        form: string;
        example: {
            translation: string;
            sentence: string;
        };
    }, {
        part_of_speech: string;
        meaning: string;
        form: string;
        example: {
            translation: string;
            sentence: string;
        };
    }>, "many">;
    exercises: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        type: z.ZodEnum<["context_identification", "sentence_completion", "translation_and_reflection", "paragraph_writing"]>;
        title: z.ZodString;
        description: z.ZodString;
        questions: z.ZodArray<z.ZodObject<{
            question: z.ZodOptional<z.ZodString>;
            sentence: z.ZodOptional<z.ZodString>;
            options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            answer: z.ZodOptional<z.ZodString>;
            explanation: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            options?: string[] | undefined;
            sentence?: string | undefined;
            question?: string | undefined;
            answer?: string | undefined;
            explanation?: string | undefined;
        }, {
            options?: string[] | undefined;
            sentence?: string | undefined;
            question?: string | undefined;
            answer?: string | undefined;
            explanation?: string | undefined;
        }>, "many">;
        word_limit: z.ZodOptional<z.ZodString>;
        prompt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        type: "context_identification" | "sentence_completion" | "translation_and_reflection" | "paragraph_writing";
        title: string;
        id: number;
        questions: {
            options?: string[] | undefined;
            sentence?: string | undefined;
            question?: string | undefined;
            answer?: string | undefined;
            explanation?: string | undefined;
        }[];
        word_limit?: string | undefined;
        prompt?: string | undefined;
    }, {
        description: string;
        type: "context_identification" | "sentence_completion" | "translation_and_reflection" | "paragraph_writing";
        title: string;
        id: number;
        questions: {
            options?: string[] | undefined;
            sentence?: string | undefined;
            question?: string | undefined;
            answer?: string | undefined;
            explanation?: string | undefined;
        }[];
        word_limit?: string | undefined;
        prompt?: string | undefined;
    }>, "many">;
    cultural_notes: z.ZodString;
}, "strip", z.ZodTypeAny, {
    word: string;
    level: string;
    translation: {
        english: string;
        chinese: string;
    };
    phonetic: {
        thai: string;
        ipa: string;
    };
    meanings: {
        type: "literal" | "figurative";
        keywords: string[];
        definition: string;
        thai_definition: string;
        part_of_speech: string[];
    }[];
    example_sentences: {
        id: number;
        translation: string;
        sentence: string;
        context: "literal" | "figurative";
        analysis: string;
        vocabulary_note?: string | undefined;
    }[];
    synonyms: {
        word: string;
        part_of_speech: string;
        meaning: string;
        usage_notes: string;
    }[];
    antonyms: {
        word: string;
        part_of_speech: string;
        meaning: string;
        usage_notes: string;
    }[];
    word_family: {
        part_of_speech: string;
        meaning: string;
        form: string;
        example: {
            translation: string;
            sentence: string;
        };
    }[];
    exercises: {
        description: string;
        type: "context_identification" | "sentence_completion" | "translation_and_reflection" | "paragraph_writing";
        title: string;
        id: number;
        questions: {
            options?: string[] | undefined;
            sentence?: string | undefined;
            question?: string | undefined;
            answer?: string | undefined;
            explanation?: string | undefined;
        }[];
        word_limit?: string | undefined;
        prompt?: string | undefined;
    }[];
    cultural_notes: string;
}, {
    word: string;
    level: string;
    translation: {
        english: string;
        chinese: string;
    };
    phonetic: {
        thai: string;
        ipa: string;
    };
    meanings: {
        type: "literal" | "figurative";
        keywords: string[];
        definition: string;
        thai_definition: string;
        part_of_speech: string[];
    }[];
    example_sentences: {
        id: number;
        translation: string;
        sentence: string;
        context: "literal" | "figurative";
        analysis: string;
        vocabulary_note?: string | undefined;
    }[];
    synonyms: {
        word: string;
        part_of_speech: string;
        meaning: string;
        usage_notes: string;
    }[];
    antonyms: {
        word: string;
        part_of_speech: string;
        meaning: string;
        usage_notes: string;
    }[];
    word_family: {
        part_of_speech: string;
        meaning: string;
        form: string;
        example: {
            translation: string;
            sentence: string;
        };
    }[];
    exercises: {
        description: string;
        type: "context_identification" | "sentence_completion" | "translation_and_reflection" | "paragraph_writing";
        title: string;
        id: number;
        questions: {
            options?: string[] | undefined;
            sentence?: string | undefined;
            question?: string | undefined;
            answer?: string | undefined;
            explanation?: string | undefined;
        }[];
        word_limit?: string | undefined;
        prompt?: string | undefined;
    }[];
    cultural_notes: string;
}>;
export declare const MARKDOWN_EXTRACTION_PROMPT = "# Role: \u7ED3\u6784\u5316\u6570\u636E\u8F6C\u6362\u4E13\u5BB6\n\n\u4F60\u662F\u4E00\u4F4D\u7CBE\u901A\u6587\u6863\u5206\u6790\u548C\u7ED3\u6784\u5316\u6570\u636E\u8F6C\u6362\u7684\u4E13\u5BB6\uFF0C\u64C5\u957F\u5C06\u683C\u5F0F\u5316\u7684Markdown\u6559\u5B66\u5185\u5BB9\u6574\u7406\u4E3A\u6E05\u6670\u3001\u5B8C\u6574\u7684JSON\u6570\u636E\u3002\n\n# Task:\n\n\u8BF7\u4ED4\u7EC6\u5206\u6790\u7528\u6237\u63D0\u4F9B\u7684Markdown\u6587\u6863\u5185\u5BB9\uFF0C\u63D0\u53D6\u5176\u4E2D\u7684\u8BED\u8A00\u6559\u5B66\u8981\u70B9\uFF0C\u5E76\u4E25\u683C\u6309\u7167\u6307\u5B9A\u7684JSON Schema\u683C\u5F0F\u8FDB\u884C\u8F93\u51FA\u8F6C\u6362\u3002\n\n# Output JSON Schema:\n\n```json\n{\n  \"topic\": \"\u6587\u6863\u7684\u6838\u5FC3\u4E3B\u9898\u6216\u6807\u9898\",\n  \"description\": \"\u6587\u6863\u4E2D\u5173\u4E8E\u8BE5\u4E3B\u9898\u7684\u539F\u6587\u63CF\u8FF0/\u4ECB\u7ECD\",\n  \"comments\": \"\u5BF9description\u5B57\u6BB5\u5185\u5BB9\u7684\u4E2D\u6587\u7FFB\u8BD1\u4E0E\u5185\u5BB9\u8981\u70B9\u89E3\u6790\",\n  \"keywords\": [\"\u4ECE\u6587\u6863\u5185\u5BB9\u4E2D\u63D0\u53D6\u7684\u5173\u952E\u8BCD\u6216\u672F\u8BED\u5217\u8868\"],\n  \"patterns\": [\n    {\n      \"format\": \"\u53E5\u578B\u7ED3\u6784\u6216\u516C\u5F0F\uFF08\u4FDD\u7559\u539F\u6587\u8BED\u8A00\uFF09\",\n      \"usage\": \"\u8BE5\u53E5\u578B\u7684\u7528\u9014\u6216\u7528\u6CD5\u8BF4\u660E\",\n      \"examples\": [\n        {\n          \"thai\": \"\u5B8C\u6574\u7684\u6CF0\u8BED\u793A\u4F8B\u53E5\u5B50\",\n          \"english\": \"\u8BE5\u793A\u4F8B\u53E5\u5B50\u7684\u51C6\u786E\u82F1\u6587\u7FFB\u8BD1\"\n        }\n      ]\n    }\n  ]\n}\n```\n\n# Instructions & Constraints:\n\n1. **\u5185\u5BB9\u63D0\u53D6**\uFF1A\n   - \u51C6\u786E\u8BC6\u522B\u6587\u6863\u4E2D\u7684\u6838\u5FC3\u6559\u5B66\u5185\u5BB9\u548C\u7ED3\u6784\n   - `topic`\u5B57\u6BB5\u63D0\u53D6\u6587\u6863\u7684\u4E3B\u6807\u9898\u6216\u6838\u5FC3\u4E3B\u9898\n   - `description`\u5B57\u6BB5\u4F7F\u7528\u6587\u6863\u4E2D\u7684**\u539F\u6587\u63CF\u8FF0**\uFF08\u901A\u5E38\u662F\u5F00\u5934\u7684\u6982\u8FF0\u6BB5\u843D\uFF09\n   - `patterns`\u6570\u7EC4\u9700\u5305\u542B\u6587\u6863\u4E2D\u5C55\u793A\u7684\u6240\u6709\u53E5\u578B\u6A21\u5F0F\n\n2. **\u591A\u5B57\u6BB5\u5904\u7406**\uFF1A\n   - `comments`: \u5C06description\u7FFB\u8BD1\u4E3A**\u4E2D\u6587**\uFF0C\u5E76\u7B80\u8981\u8BF4\u660E\u6587\u6863\u7684\u6838\u5FC3\u5185\u5BB9\u4E0E\u6559\u5B66\u903B\u8F91\n   - `keywords`: \u4ECE\u6587\u6863\u7684\u53E5\u578B\u3001\u6807\u9898\u548C\u5185\u5BB9\u4E2D\u63D0\u53D6\u6700\u5177\u4EE3\u8868\u6027\u7684\u5173\u952E\u8BCD\n   - \u6BCF\u4E2A`pattern`\u5FC5\u987B\u5305\u542B`format`\uFF08\u53E5\u578B\u7ED3\u6784\uFF09\u3001`usage`\uFF08\u7528\u9014\u7528\u6CD5\uFF09\u548C`examples`\uFF08\u4F8B\u53E5\uFF09\u4E09\u4E2A\u5B50\u5B57\u6BB5\n\n3. **\u6570\u636E\u5B8C\u6574\u6027**\uFF1A\n   - \u786E\u4FDD\u63D0\u53D6\u6587\u6863\u4E2D\u6240\u6709\u5C55\u793A\u7684\u53E5\u578B\u6A21\u5F0F\n   - \u6BCF\u4E2A\u53E5\u578B\u7684`usage`\u5B57\u6BB5\u5FC5\u987B\u4ECE\u539F\u6587\u4E2D\u63D0\u53D6\u5BF9\u5E94\u7684\"\u7528\u9014\u7528\u6CD5\"\u63CF\u8FF0\n   - `examples`\u6570\u7EC4\u4E2D\u7684\u6BCF\u4E2A\u4F8B\u53E5\u5FC5\u987B\u5305\u542B\u539F\u6587\u548C\u5BF9\u5E94\u7684\u82F1\u6587\u7FFB\u8BD1\n\n4. **\u683C\u5F0F\u89C4\u8303**\uFF1A\n   - \u8F93\u51FA\u5FC5\u987B\u662F\u4E25\u683C\u3001\u6709\u6548\u7684JSON\u683C\u5F0F\n   - \u4E0D\u5305\u542B\u4EFB\u4F55JSON\u683C\u5F0F\u5757\u4EE5\u5916\u7684\u89E3\u91CA\u6216\u989D\u5916\u6587\u5B57\n   - \u4FDD\u6301\u539F\u6587\u7684\u8BED\u8A00\u672F\u8BED\u548C\u683C\u5F0F\uFF08\u5982\u6CF0\u8BED\u8BED\u6CD5\u672F\u8BED\u4E0D\u7FFB\u8BD1\uFF09\n\n5. **\u7279\u6B8A\u8981\u6C42**\uFF1A\n   - \u5982\u539F\u6587\u4F7F\u7528\u8868\u683C\u5F62\u5F0F\u7EC4\u7EC7\u5185\u5BB9\uFF0C\u9700\u6B63\u786E\u8BC6\u522B\u8868\u683C\u4E2D\u7684\"\u5E38\u7528\u53E5\u578B\"\u3001\"\u7528\u9014\u7528\u6CD5\"\u3001\"\u5178\u578B\u4F8B\u53E5\"\u4E09\u5217\n   - \u786E\u4FDD\u53E5\u578B\u516C\u5F0F\u4E2D\u7684\u5360\u4F4D\u7B26\uFF08\u5982`...`\u3001`[\u59D3\u540D]`\uFF09\u5728format\u5B57\u6BB5\u4E2D\u5B8C\u6574\u4FDD\u7559\n   - \u4F8B\u53E5\u4E2D\u7684\u6CF0\u8BED\u6807\u70B9\u7B26\u53F7\u9700\u6B63\u786E\u5904\u7406\n\n# \u5904\u7406\u6D41\u7A0B\u63D0\u793A\uFF1A\n\n1. \u9996\u5148\u8BC6\u522B\u6587\u6863\u7684\u6574\u4F53\u7ED3\u6784\u548C\u4E3B\u9898\n2. \u63D0\u53D6\u6240\u6709\u53E5\u578B\u90E8\u5206\uFF0C\u6309\u539F\u6587\u987A\u5E8F\u6574\u7406\n3. \u4E3A\u6BCF\u4E2A\u53E5\u578B\u5339\u914D\u5BF9\u5E94\u7684\u7528\u9014\u8BF4\u660E\u548C\u4F8B\u53E5\n4. \u4ECE\u6574\u4F53\u5185\u5BB9\u4E2D\u63D0\u70BC\u5173\u952E\u8BCD\n5. \u6784\u5EFA\u5B8C\u6574\u7684JSON\u7ED3\u6784\n\n\u8BF7\u4E25\u683C\u6309\u7167\u4E0A\u8FF0\u8981\u6C42\u5904\u7406\u8F93\u5165\u7684Markdown\u6587\u6863\uFF0C\u8F93\u51FA\u7EAF\u51C0\u7684JSON\u6570\u636E\u3002";
export declare const COMMON_SENTENCES_PROMPT = "## \u80CC\u666F\n\u4F60\u662F\u4E00\u4E2A\u7ED3\u6784\u5316\u6570\u636E\u5904\u7406\u4E13\u5BB6\u3002\u4F60\u7684\u4EFB\u52A1\u662F\u6839\u636E\u7528\u6237\u63D0\u4F9B\u7684\u6587\u6863\u5185\u5BB9\uFF0C\u63D0\u53D6\u5173\u952E\u4FE1\u606F\u5E76\u6309\u7167\u6307\u5B9A\u7684JSON schema\u751F\u6210\u7ED3\u6784\u5316\u7684\u6570\u636E\u3002\n\n## \u8F93\u5165\n\u7528\u6237\u5C06\u63D0\u4F9B\u5305\u542B\u4EE5\u4E0B\u4FE1\u606F\u7684\u6587\u6863\uFF1A\n1. \u6587\u6863\u6807\u9898\n2. \u6587\u6863\u7B80\u4ECB/\u6982\u8FF0\n3. \u591A\u4E2A\u5185\u5BB9\u5206\u7EC4\uFF0C\u6BCF\u4E2A\u5206\u7EC4\u5305\u542B\uFF1A\n   - \u5206\u7EC4\u6807\u9898\n   - \u5206\u7EC4\u63CF\u8FF0\n   - \u82E5\u5E72\u4E2A\u5B50\u7C7B\u522B\uFF0C\u6BCF\u4E2A\u5B50\u7C7B\u522B\u5305\u542B\uFF1A\n     - \u5B50\u7C7B\u522B\u6807\u9898\n     - \u5B50\u7C7B\u522B\u526F\u6807\u9898\uFF08\u901A\u5E38\u4E3A\u6CF0\u8BED\u540D\u79F0\uFF09\n     - \u591A\u4E2A\u53E5\u5B50\u6761\u76EE\uFF0C\u6BCF\u4E2A\u6761\u76EE\u5305\u542B\u6CF0\u8BED\u548C\u4E2D\u6587\u6587\u672C\n\n## \u8F93\u51FA\u8981\u6C42\n\n### 1. JSON\u7ED3\u6784\n\u4F60\u5FC5\u987B\u8F93\u51FA\u4E00\u4E2A\u7B26\u5408\u4EE5\u4E0Bschema\u7684JSON\u5BF9\u8C61\uFF1A\n\n```json\n{\n  \"title\": \"string - \u6587\u6863\u6807\u9898\",\n  \"introduction\": \"string - \u6587\u6863\u7B80\u4ECB\",\n  \"sections\": [\n    {\n      \"sectionTitle\": \"string - \u5206\u7EC4\u6807\u9898\",\n      \"sectionDescription\": \"string - \u5206\u7EC4\u63CF\u8FF0\",\n      \"categories\": [\n        {\n          \"categoryTitle\": \"string - \u5B50\u7C7B\u522B\u6807\u9898\uFF08\u4E2D\u6587\uFF09\",\n          \"categorySubtitle\": \"string - \u5B50\u7C7B\u522B\u526F\u6807\u9898\uFF08\u6CF0\u8BED\uFF0C\u5305\u542B\u62EC\u53F7\uFF09\",\n          \"sentences\": [\n            {\n              \"thai\": \"string - \u6CF0\u8BED\u53E5\u5B50\",\n              \"chinese\": \"string - \u4E2D\u6587\u7FFB\u8BD1\"\n            }\n          ]\n        }\n      ]\n    }\n  ]\n}\n```\n\n### 2. \u5185\u5BB9\u63D0\u53D6\u89C4\u5219\n1. **\u6807\u9898\u63D0\u53D6**\uFF1A\u4ECE\u6587\u6863\u6700\u9876\u90E8\u7684\u6807\u9898\uFF08\u901A\u5E38\u4EE5##\u5F00\u5934\uFF09\u4E2D\u63D0\u53D6\n2. **\u7B80\u4ECB\u63D0\u53D6**\uFF1A\u4ECE\u6807\u9898\u4E0B\u65B9\u7684\u63CF\u8FF0\u6027\u6BB5\u843D\u4E2D\u63D0\u53D6\n3. **\u5206\u7EC4\u8BC6\u522B**\uFF1A\u6BCF\u4E2A\u4E3B\u8981\u5206\u7EC4\u4EE5##\u5F00\u5934\uFF0C\u5305\u542B\u5206\u7EC4\u6807\u9898\u548C\u63CF\u8FF0\n4. **\u5B50\u7C7B\u522B\u8BC6\u522B**\uFF1A\u5B50\u7C7B\u522B\u4EE5###\u6216\u5217\u8868\u9879\u5F62\u5F0F\u51FA\u73B0\uFF0C\u901A\u5E38\u5305\u542B\u6807\u9898\u548C\u526F\u6807\u9898\n5. **\u53E5\u5B50\u63D0\u53D6**\uFF1A\n   - \u6BCF\u4E2A\u53E5\u5B50\u6761\u76EE\u901A\u5E38\u4EE5\u6570\u5B57\u5E8F\u53F7\u5F00\u5934\n   - \u6CF0\u8BED\u90E8\u5206\u4E3A\u53E5\u5B50\u672C\u8EAB\n   - \u4E2D\u6587\u90E8\u5206\u5728\u6CF0\u8BED\u4E0B\u65B9\uFF0C\u4EE5\u62EC\u53F7\u5305\u88F9\n   - \u4FDD\u6301\u539F\u6587\u683C\u5F0F\uFF0C\u4E0D\u6DFB\u52A0\u989D\u5916\u5185\u5BB9\n\n### 3. \u683C\u5F0F\u8981\u6C42\n1. \u4E25\u683C\u9075\u5FAAJSON\u683C\u5F0F\uFF0C\u786E\u4FDD\u6709\u6548\u7684JSON\u8BED\u6CD5\n2. \u6240\u6709\u5B57\u7B26\u4E32\u4F7F\u7528\u53CC\u5F15\u53F7\n3. \u6570\u7EC4\u548C\u5BF9\u8C61\u4FDD\u6301\u6B63\u786E\u7684\u7F29\u8FDB\u5C42\u7EA7\n4. \u4E0D\u8981\u5305\u542B\u4EFB\u4F55JSON\u4E4B\u5916\u7684\u6587\u672C\u3001\u89E3\u91CA\u6216markdown\u683C\u5F0F\n5. \u5982\u679C\u67D0\u4E9B\u5B57\u6BB5\u5728\u6587\u6863\u4E2D\u7F3A\u5931\uFF0C\u53EF\u4EE5\u4F7F\u7528\u7A7A\u5B57\u7B26\u4E32\u6216\u9002\u5F53\u63A8\u65AD\n\n### 4. \u6570\u636E\u6E05\u6D17\u89C4\u5219\n1. \u79FB\u9664\u53E5\u5B50\u524D\u7684\u6570\u5B57\u5E8F\u53F7\u548C\u6807\u70B9\uFF08\u59821. **\u3001**\uFF09\n2. \u4FDD\u6301\u6CF0\u8BED\u539F\u6587\u7684\u5B8C\u6574\u6027\u548C\u6807\u70B9\u7B26\u53F7\n3. \u4E2D\u6587\u7FFB\u8BD1\u4FDD\u7559\u4F46\u79FB\u9664\u62EC\u53F7\uFF08()\u6216\uFF08\uFF09\uFF09\n4. \u6807\u9898\u548C\u63CF\u8FF0\u4E2D\u7684markdown\u6807\u8BB0\uFF08\u5982**\u3001\uD83D\uDCD8\u7B49\uFF09\u53EF\u4EE5\u79FB\u9664\n\n### 5. \u9A8C\u8BC1\u68C0\u67E5\n\u5728\u8F93\u51FA\u524D\u8BF7\u786E\u4FDD\uFF1A\n- [ ] JSON\u8BED\u6CD5\u6B63\u786E\uFF0C\u53EF\u4EE5\u901A\u8FC7JSON\u89E3\u6790\u5668\u9A8C\u8BC1\n- [ ] \u6240\u6709\u5FC5\u586B\u5B57\u6BB5\u90FD\u5B58\u5728\n- [ ] \u6570\u7EC4\u957F\u5EA6\u4E0E\u5B9E\u9645\u6761\u76EE\u6570\u4E00\u81F4\n- [ ] \u6CA1\u6709\u4E22\u5931\u4EFB\u4F55\u6587\u6863\u4E2D\u7684\u91CD\u8981\u5185\u5BB9\n- [ ] \u6570\u636E\u7C7B\u578B\u7B26\u5408schema\u8981\u6C42\n\n## \u5904\u7406\u6D41\u7A0B\u63D0\u793A\uFF1A\n\n1. \u9996\u5148\u8BC6\u522B\u6587\u6863\u7684\u6574\u4F53\u7ED3\u6784\u548C\u4E3B\u9898\n2. \u63D0\u53D6\u6240\u6709\u53E5\u578B\u90E8\u5206\uFF0C\u6309\u539F\u6587\u987A\u5E8F\u6574\u7406\n3. \u4E3A\u6BCF\u4E2A\u53E5\u578B\u5339\u914D\u5BF9\u5E94\u7684\u7528\u9014\u8BF4\u660E\u548C\u4F8B\u53E5\n4. \u4ECE\u6574\u4F53\u5185\u5BB9\u4E2D\u63D0\u70BC\u5173\u952E\u8BCD\n5. \u6784\u5EFA\u5B8C\u6574\u7684JSON\u7ED3\u6784\n\n\u8BF7\u4E25\u683C\u6309\u7167\u4E0A\u8FF0\u8981\u6C42\u5904\u7406\u8F93\u5165\u7684Markdown\u6587\u6863\uFF0C\u8F93\u51FA\u7EAF\u51C0\u7684JSON\u6570\u636E\u3002";
export declare const THAI_ARTICLE_PROMPT = "**Role:** \u4F60\u662F\u4E00\u4F4D\u6CF0\u8BED\u8BED\u8A00\u5B66\u4E13\u5BB6\uFF0C\u64C5\u957F\u5C06\u6CF0\u8BED\u6587\u7AE0\u62C6\u5206\u4E3A\u6BB5\u843D\u548C\u53E5\u5B50\uFF0C\u5E76\u63D0\u4F9B\u51C6\u786E\u7684\u7FFB\u8BD1\u3002\n\n**Task:** \u8BF7\u5904\u7406\u7528\u6237\u63D0\u4F9B\u7684\u6CF0\u8BED\u6587\u7AE0\uFF08Markdown \u6216 \u7EAF\u6587\u672C\uFF09\uFF0C\u5C06\u5176\u8F6C\u6362\u4E3A\u7ED3\u6784\u5316\u7684 JSON\uFF0C\u7528\u4E8E\u6CF0\u8BED\u9605\u8BFB\u5B66\u4E60\u5E94\u7528\u3002\n\n**Instructions:**\n1. **\u7ED3\u6784\u5316\u62C6\u5206**\uFF1A\n   - \u5C06\u6587\u7AE0\u62C6\u5206\u4E3A\u6709\u610F\u4E49\u7684\u6BB5\u843D (`paragraphs`)\u3002\n   - \u6BCF\u4E2A\u6BB5\u843D\u5185\u90E8\u6309\u6807\u70B9\u6216\u8BED\u610F\u5C06\u5176\u62C6\u5206\u4E3A\u72EC\u7ACB\u7684\u53E5\u5B50 (`sentences`)\u3002\n2. **\u7FFB\u8BD1**\uFF1A\u4E3A\u6BCF\u4E2A\u53E5\u5B50\u63D0\u4F9B\u51C6\u786E\u3001\u5730\u9053\u7684\u82F1\u6587\u7FFB\u8BD1\u3002\n3. **\u5143\u6570\u636E**\uFF1A\n   - `id`: \u8BF7\u751F\u6210\u4E00\u4E2A\u65B0\u7684 uuid (\u5982 'f47ac10b-...') \u6216\u63D0\u53D6\u6587\u7AE0\u4E2D\u9690\u542B\u7684 ID\u3002\n   - `title`: \u63D0\u53D6\u6216\u603B\u7ED3\u6587\u7AE0\u6807\u9898\u3002\n   - `sentence_id`: \u4E3A\u6BCF\u4E2A\u53E5\u5B50\u751F\u6210\u72EC\u7ACB\u7684 uuid\u3002\n   - `audioURI`: \u7EDF\u4E00\u8BBE\u7F6E\u4E3A `audio/[sentence_id].mp3`\uFF08\u6CE8\u610F\uFF1A\u540E\u7F00\u4E3A .mp3\uFF0C\u4E0E TTS \u8F93\u51FA\u4E00\u81F4\uFF09\u3002\n4. **\u8BCD\u6C47\u63D0\u53D6**\uFF08\u53EF\u9009\uFF09\uFF1A\u63D0\u53D6\u6587\u7AE0\u4E2D\u7684 5-10 \u4E2A\u5173\u952E\u751F\u8BCD\u53CA\u5176\u6CF0\u8BED\u53D1\u97F3 and \u5B9A\u4E49\u3002\n\n**Output Format:** \u4E25\u683C\u6309\u7167\u63D0\u4F9B\u7684 JSON Schema \u8F93\u51FA\uFF0C\u4E0D\u5305\u542B\u4EFB\u4F55\u591A\u4F59\u89E3\u91CA\u3002";
export declare const THAI_WORD_LEARNING_PROMPT = "## \u89D2\u8272\u8BBE\u5B9A\n\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u6CF0\u8BED\u6559\u5B66\u4E13\u5BB6\uFF0C\u64C5\u957F\u4E3A\u4E2D\u9AD8\u7EA7\u6CF0\u8BED\u5B66\u4E60\u8005\uFF08A2\u5411B1\u8FC7\u6E21\u9636\u6BB5\uFF09\u8BBE\u8BA1\u7CFB\u7EDF\u6027\u7684\u8BCD\u6C47\u6559\u5B66\u6750\u6599\u3002\u4F60\u9700\u8981\u6309\u7167\u6307\u5B9A\u7684JSON\u683C\u5F0F\uFF0C\u4E3A\u7ED9\u5B9A\u7684\u6CF0\u8BED\u5355\u8BCD\u751F\u6210\u5B8C\u6574\u7684\u6559\u5B66\u6570\u636E\u3002\n\n## \u4EFB\u52A1\u63CF\u8FF0\n\u4E3A\u8F93\u5165\u7684\u6CF0\u8BED\u5355\u8BCD\u751F\u6210\u4E00\u4E2A\u7ED3\u6784\u5316\u7684JSON\u6570\u636E\uFF0C\u5305\u542B\u8BE5\u8BCD\u7684\u5B8C\u6574\u6559\u5B66\u4FE1\u606F\u3002\u8BE5JSON\u5C06\u7528\u4E8E\u8BED\u8A00\u5B66\u4E60\u7CFB\u7EDF\uFF0C\u5E2E\u52A9\u5B66\u751F\u4ECE\u591A\u7EF4\u5EA6\u638C\u63E1\u8BCD\u6C47\u3002\n\n## \u8F93\u5165\u683C\u5F0F\n\u7528\u6237\u5C06\u63D0\u4F9B\u4E00\u4E2A\u6CF0\u8BED\u5355\u8BCD\uFF0C\u4F8B\u5982\uFF1A`\u0E22\u0E37\u0E14\u0E2B\u0E22\u0E38\u0E48\u0E19`\n\n## \u8F93\u51FA\u8981\u6C42\n\u5FC5\u987B\u4E25\u683C\u6309\u7167\u63D0\u4F9B\u7684 JSON Schema \u751F\u6210\u6570\u636E\uFF0C\u786E\u4FDD\u5B57\u6BB5\u5B8C\u6574\u3001\u683C\u5F0F\u6B63\u786E\u3001\u5185\u5BB9\u51C6\u786E\u3002\n\n---\n\n## \u751F\u6210\u6307\u5357\n\n\u8BF7\u9075\u5FAA\u4EE5\u4E0B\u89C4\u5219\u751F\u6210\u5185\u5BB9\uFF1A\n\n### 1. \u8BCD\u4E49\u5206\u6790 (meanings)\n- **literal (\u672C\u4E49)**\uFF1A\u63CF\u8FF0\u8BE5\u8BCD\u7684\u7269\u7406\u5C5E\u6027\uFF0C\u6307\u7269\u4F53\u7684\u5F39\u6027\u3001\u4F38\u7F29\u6027\n- **figurative (\u5F15\u7533\u4E49)**\uFF1A\u63CF\u8FF0\u62BD\u8C61\u6982\u5FF5\uFF0C\u6307\u4EBA\u7684\u7075\u6D3B\u6027\u3001\u53D8\u901A\u6027\uFF0C\u6216\u653F\u7B56\u7684\u5F39\u6027\u7A7A\u95F4\n- **\u5FC5\u987B\u540C\u65F6\u5305\u542B literal \u548C figurative \u4E24\u4E2A\u542B\u4E49**\n\n### 2. \u53D1\u97F3\u6807\u6CE8 (phonetic)\n- \u4F7F\u7528 **IPA (\u56FD\u9645\u97F3\u6807)** \u6807\u6CE8\u53D1\u97F3\n- \u786E\u4FDD\u6807\u6CE8\u51C6\u786E\uFF0C\u53CD\u6620\u771F\u5B9E\u53D1\u97F3\n\n### 3. \u4F8B\u53E5 (example_sentences) - **\u91CD\u8981\u7EA6\u675F**\n- \u5FC5\u987B\u5305\u542B\u81F3\u5C116\u4E2A\u4F8B\u53E5\n- \u786E\u4FDD literal \u548C figurative \u4E24\u79CD\u8BED\u5883\u7684\u4F8B\u53E5\u5747\u8861\u5206\u5E03\uFF08\u54043\u4E2A\u5DE6\u53F3\uFF09\n- **\u6838\u5FC3\u8981\u6C42\uFF1A\u4F8B\u53E5\u4E2D\u9664\u4E86\u76EE\u6807\u8BCD\u53CA\u5176\u6D3E\u751F\u8BCD\u5916\uFF0C\u5176\u4ED6\u8BCD\u6C47\u5E94\u4E3B\u8981\u63A7\u5236\u5728A2\u6C34\u5E73**\n- \u907F\u514D\u4F7F\u7528\u590D\u6742\u7684\u6210\u8BED\u3001\u4E66\u9762\u8BED\u6216\u9AD8\u7EA7\u8BCD\u6C47\n- \u5982\u6709\u5FC5\u8981\u4F7F\u7528\u7A0D\u96BE\u7684\u8BCD\u6C47\uFF08\u5982\u4E13\u4E1A\u672F\u8BED\uFF09\uFF0C\u8BF7\u5728 `vocabulary_note` \u5B57\u6BB5\u4E2D\u7B80\u8981\u89E3\u91CA\n- \u6BCF\u4E2A\u4F8B\u53E5\u9700\u5305\u542B\uFF1A\n  - \u6CF0\u8BED\u539F\u6587\uFF08\u6B63\u786E\u62FC\u5199\uFF09\n  - \u4E2D\u6587\u7FFB\u8BD1\uFF08\u51C6\u786E\u901A\u987A\uFF09\n  - context \u6807\u6CE8\uFF08literal/figurative\uFF09\n  - analysis \u5206\u6790\uFF08\u8BF4\u660E\u4F8B\u53E5\u7684\u8BED\u5883\u548C\u7528\u6CD5\u7279\u70B9\uFF09\n  - vocabulary_note\uFF08\u53EF\u9009\uFF0C\u89E3\u91CA\u53E5\u4E2D\u53EF\u80FD\u51FA\u73B0\u7684\u7A0D\u96BE\u8BCD\u6C47\uFF09\n\n### 4. \u8FD1\u4E49\u8BCD (synonyms)\n- \u81F3\u5C11\u63D0\u4F9B3-4\u4E2A\u8FD1\u4E49\u8BCD\n- \u6BCF\u4E2A\u8FD1\u4E49\u8BCD\u9700\u5305\u542B\u7528\u6CD5\u8FA8\u6790\u8BF4\u660E\n- \u8FD1\u4E49\u8BCD\u672C\u8EAB\u96BE\u5EA6\u53EF\u4EE5\u7A0D\u9AD8\uFF0C\u4F46\u8FA8\u6790\u8BF4\u660E\u8981\u6E05\u6670\u6613\u61C2\n\n### 5. \u53CD\u4E49\u8BCD (antonyms)\n- \u81F3\u5C11\u63D0\u4F9B3\u4E2A\u53CD\u4E49\u8BCD\n- \u6BCF\u4E2A\u53CD\u4E49\u8BCD\u9700\u5305\u542B\u7528\u6CD5\u8BF4\u660E\n\n### 6. \u8BCD\u65CF (word_family)\n- \u81F3\u5C11\u63D0\u4F9B2\u4E2A\u6D3E\u751F\u8BCD\u5F62\u5F0F\uFF08\u540D\u8BCD\u5F62\u5F0F\u3001\u526F\u8BCD\u5F62\u5F0F\u7B49\uFF09\n- \u6BCF\u4E2A\u6D3E\u751F\u8BCD\u9700\u914D\u4F8B\u53E5\n- **\u6D3E\u751F\u8BCD\u4F8B\u53E5\u540C\u6837\u9075\u5FAAA2\u8BCD\u6C47\u4E3A\u4E3B\u7684\u539F\u5219**\n\n### 7. \u7EC3\u4E60 (exercises)\n\u5FC5\u987B\u5305\u542B\u4EE5\u4E0B4\u79CD\u7EC3\u4E60\u7C7B\u578B\uFF1A\n\n1. **\u8BED\u5883\u8FA8\u8BC6 (context_identification)**\uFF1A\u5305\u542B 4 \u4E2A\u53E5\u5B50\uFF0C\u8981\u6C42\u5224\u65AD literal/figurative.\n2. **\u5B8C\u6210\u53E5\u5B50 (sentence_completion)**\uFF1A\u5305\u542B 4 \u4E2A\u586B\u7A7A\u9898\uFF0C\u7528\u8BE5\u8BCD\u6216\u5176\u6D3E\u751F\u8BCD\u586B\u7A7A.\n3. **\u7FFB\u8BD1\u4E0E\u5BF9\u6BD4 (translation_and_reflection)**\uFF1A\u5305\u542B 2 \u4E2A\u95EE\u9898\uFF08\u7FFB\u8BD1\u5BF9\u6BD4\u3001\u6587\u5316\u601D\u8003\uFF09.\n4. **\u6BB5\u843D\u5199\u4F5C (paragraph_writing)**\uFF1A\u63D0\u4F9B\u9898\u76EE\u548C\u63D0\u793A.\n\n\u6240\u6709\u7EC3\u4E60\u53E5\u5B50\u540C\u6837\u9075\u5FAAA2\u8BCD\u6C47\u4E3A\u4E3B\u7684\u539F\u5219\u3002\n\n### 8. \u6587\u5316\u6CE8\u91CA (cultural_notes)\n- \u4E0D\u5C11\u4E8E50\u5B57\n- \u63A2\u8BA8\u8BE5\u8BCD\u4E0E\u6CF0\u56FD\u6587\u5316\u3001\u601D\u7EF4\u65B9\u5F0F\u3001\u793E\u4F1A\u4EF7\u503C\u89C2\u7684\u5173\u8054\n\n---\n\n## \u8BCD\u6C47\u6C34\u5E73\u53C2\u8003\uFF08A2\u7EA7\u522B\u5178\u578B\u8BCD\u6C47\uFF09\n\uFF08\u6B64\u5904\u7701\u7565\u53C2\u8003\u8868\uFF0C\u4F46\u5728\u751F\u6210\u65F6\u8BF7\u52A1\u5FC5\u4E25\u683C\u63A7\u5236\u8BCD\u6C47\u6C34\u5E73\uFF09\n\n---\n\n## \u8D28\u91CF\u68C0\u67E5\u6E05\u5355\n- \u6240\u6709\u5FC5\u586B\u5B57\u6BB5\u90FD\u5DF2\u586B\u5199\n- \u53D1\u97F3\u6807\u6CE8\u4F7F\u7528IPA\u683C\u5F0F\n- \u4F8B\u53E5\u6570\u91CF\u4E0D\u5C11\u4E8E6\u4E2A\n- \u6240\u6709\u4F8B\u53E5\u9664\u76EE\u6807\u8BCD\u5916\uFF0C\u5176\u4ED6\u8BCD\u6C47\u4E3B\u8981\u63A7\u5236\u5728A2\u6C34\u5E73\n- \u5305\u542B\u5168\u90E84\u79CD\u7EC3\u4E60\u7C7B\u578B\n- cultural_notes \u4E0D\u5C11\u4E8E50\u5B57\n- JSON \u683C\u5F0F\u6B63\u786E\n\n---\n\n\u8BF7\u4E3A\u4EE5\u4E0B\u6CF0\u8BED\u5355\u8BCD\u751F\u6210\u6559\u5B66\u6750\u6599\uFF1A";
export declare const geminiAgent: Agent<"GeminiAgent", import("@mastra/core/agent").ToolsInput, undefined, unknown>;
export declare const mastra: Mastra<{
    geminiAgent: Agent<"GeminiAgent", import("@mastra/core/agent").ToolsInput, undefined, unknown>;
}, Record<string, import("@mastra/core").Workflow<any, any, any, any, any, any, any, unknown>>, Record<string, import("@mastra/core").MastraVectorProvider<any>>, Record<string, import("@mastra/core/dist/tts").MastraTTS>, import("@mastra/core").Logger, Record<string, import("@mastra/core/dist/mcp").MCPServerBase<any>>, Record<string, import("@mastra/core/dist/evals").MastraScorer<any, any, any, any>>, Record<string, import("@mastra/core").ToolAction<any, any, any, any, any, any, unknown>>, Record<string, import("@mastra/core/dist/processors").Processor<any, unknown>>, Record<string, import("@mastra/core").MastraMemory>>;
//# sourceMappingURL=agent.d.ts.map