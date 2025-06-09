import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Scheme } from "../types"
import { ExternalLink, Landmark, Tag, CalendarDays, Users } from "lucide-react"

interface SchemeListItemProps {
  scheme: Scheme
}

export function SchemeListItem({ scheme }: SchemeListItemProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg">
            <Link href={`/schemes/${scheme.id}`} className="hover:underline">
              {scheme.name}
            </Link>
          </CardTitle>
          <Badge
            variant={scheme.status === "Active" ? "default" : scheme.status === "Proposed" ? "outline" : "secondary"}
          >
            {scheme.status}
          </Badge>
        </div>
        {scheme.scheme_code && (
          <CardDescription className="text-xs text-muted-foreground">Code: {scheme.scheme_code}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm">
        {scheme.description && <p className="text-muted-foreground line-clamp-3">{scheme.description}</p>}
        <div className="space-y-1">
          {scheme.category && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span>{scheme.category.name}</span>
            </div>
          )}
          {scheme.issuing_authority_ou && (
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <span>{scheme.issuing_authority_ou.name}</span>
            </div>
          )}
          {scheme.start_date && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>
                Effective: {new Date(scheme.start_date).toLocaleDateString()}
                {scheme.end_date && ` - ${new Date(scheme.end_date).toLocaleDateString()}`}
              </span>
            </div>
          )}
          {scheme.target_beneficiaries && (
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-muted-foreground mt-1" />
              <span className="line-clamp-2">Beneficiaries: {scheme.target_beneficiaries}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {scheme.website_url && (
          <a
            href={scheme.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            Official Website <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardFooter>
    </Card>
  )
}
