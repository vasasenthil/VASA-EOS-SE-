import { MapPin } from "lucide-react"

export function MapPlaceholder() {
  return (
    <div className="aspect-[16/9] w-full bg-muted rounded-lg flex flex-col items-center justify-center">
      <MapPin className="h-16 w-16 text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground">Policy Implementation Map Placeholder</p>
      <p className="text-xs text-muted-foreground/70">Interactive map will be displayed here.</p>
    </div>
  )
}
