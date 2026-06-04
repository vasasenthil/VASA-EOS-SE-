import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AGENTS } from "@/lib/agents"
import { AgentConsole } from "./agent-console"

export default function AiAgentsPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>AI Agent Orchestration</PageHeaderHeading>
        <PageHeaderDescription>
          8 specialised agents coordinated via MCP. AI augments — never replaces. High-stakes actions route through
          human-in-the-loop approval, and low-confidence outputs are presented as suggestions.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {AGENTS.map((a) => (
          <Card key={a.name}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {a.label}
                {a.highStakes ? <Badge variant="destructive">human-in-the-loop</Badge> : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{a.scope}</p>
              <div className="flex flex-wrap gap-1">
                {a.tools.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AgentConsole agents={AGENTS.map((a) => ({ name: a.name, label: a.label, highStakes: a.highStakes }))} />
    </Shell>
  )
}
