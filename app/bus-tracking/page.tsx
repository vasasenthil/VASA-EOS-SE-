import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { TrackingBoard } from "./tracking-board"

export default function BusTrackingPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Bus Live Tracking</PageHeaderHeading>
        <PageHeaderDescription>
          Fleet view with per-bus route progress and ETA — advance stops to simulate GPS pings and flag delays.
          Production binds to real device telemetry and parent ETA alerts.
        </PageHeaderDescription>
      </PageHeader>
      <TrackingBoard />
    </Shell>
  )
}
