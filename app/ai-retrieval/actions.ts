"use server"

import { unstable_noStore as noStore } from "next/cache"
import { invokeTool, describeTools, type ToolResult, type ToolDescriptor } from "@/lib/mcp"
import { listArticles } from "@/lib/knowledgebase/store"
import { asCorpus } from "@/lib/knowledgebase"
import { logger } from "@/lib/logger"

export async function listToolsAction(): Promise<ToolDescriptor[]> {
  return describeTools()
}

/**
 * MCP-style tool invocation: build the grounding context from the live knowledge base, then invoke
 * the chosen tool with the agent/user's inputs. Returns a structured, cited, human-authority result.
 */
export async function invokeToolAction(name: string, input: Record<string, string>): Promise<ToolResult> {
  noStore()
  try {
    const corpus = asCorpus(await listArticles())
    return invokeTool(name, input, { corpus })
  } catch (e) {
    logger.error("mcp.invoke failed", { error: String(e), tool: name })
    return { ok: false, toolName: name, summary: "The retrieval service is unavailable.", citations: [], data: {}, grounded: false, reason: "server-error", humanAuthority: true }
  }
}
