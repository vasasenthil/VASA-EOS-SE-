import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription, PageHeaderActions } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { agentCapabilities, agentCatalogueSummary } from "@/lib/agents/catalogue"

export default function AgentCataloguePage() {
  const s = agentCatalogueSummary()
  const caps = agentCapabilities()
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>AI Agent Capability Catalogue</PageHeaderHeading>
        <PageHeaderDescription>
          The {s.agents} specialised agents that make up the Native-AI fabric — each agent's scope, the MCP tools it can
          dispatch, and whether it is high-stakes (and therefore human-in-the-loop). Composed live from the agent spec and
          the MCP tool definitions. Results at or above {Math.round(s.confidenceThreshold * 100)}% confidence are presented
          assertively; below, as a suggestion needing human judgement.
        </PageHeaderDescription>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <a href="/api/ai-agents/catalogue/csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download (CSV)
            </a>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.agents}</div><div className="text-sm text-muted-foreground">Specialised agents</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{s.mcpTools}</div><div className="text-sm text-muted-foreground">MCP tools</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold text-destructive">{s.highStakes}</div><div className="text-sm text-muted-foreground">High-stakes (HITL)</div></CardContent></Card>
        <Card><CardContent className="py-4"><div className="text-2xl font-semibold">{Math.round(s.confidenceThreshold * 100)}%</div><div className="text-sm text-muted-foreground">Assertive threshold</div></CardContent></Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {caps.map((c) => (
          <Card key={c.name}>
            <CardContent className="pt-6">
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-lg font-semibold">{c.label}</h2>
                {c.highStakes && <Badge variant="destructive">High-stakes · HITL</Badge>}
              </div>
              <p className="mb-3 text-sm text-muted-foreground">{c.scope}</p>
              <div className="text-xs font-medium text-muted-foreground">MCP tools</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {c.mcpTools.map((t) => (
                  <Badge key={t} variant="secondary" className="font-mono text-[10px]">{t}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  )
}
