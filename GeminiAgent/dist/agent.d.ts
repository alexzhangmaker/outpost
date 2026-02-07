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
    }, {
        format: string;
        examples: {
            thai: string;
            english: string;
        }[];
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
    }[];
}>;
export declare const geminiAgent: Agent<"GeminiAgent", import("@mastra/core/agent").ToolsInput, undefined, unknown>;
export declare const mastra: Mastra<{
    geminiAgent: Agent<"GeminiAgent", import("@mastra/core/agent").ToolsInput, undefined, unknown>;
}, Record<string, import("@mastra/core").Workflow<any, any, any, any, any, any, any, unknown>>, Record<string, import("@mastra/core").MastraVectorProvider<any>>, Record<string, import("@mastra/core/dist/tts").MastraTTS>, import("@mastra/core").Logger, Record<string, import("@mastra/core/dist/mcp").MCPServerBase<any>>, Record<string, import("@mastra/core/dist/evals").MastraScorer<any, any, any, any>>, Record<string, import("@mastra/core").ToolAction<any, any, any, any, any, any, unknown>>, Record<string, import("@mastra/core/dist/processors").Processor<any, unknown>>, Record<string, import("@mastra/core").MastraMemory>>;
//# sourceMappingURL=agent.d.ts.map