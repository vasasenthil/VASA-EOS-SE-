import { Shell } from "@/components/shell"
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header"
import { CommsComposer } from "./comms-composer"

export default function CommunicationsPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Communications Centre</PageHeaderHeading>
        <PageHeaderDescription>
          Compose multi-channel messages to parents and staff — SMS, WhatsApp, IVR voice or app push. Pick a channel and
          audience, write your message, and send. Production routes through Bhashini for multilingual delivery.
        </PageHeaderDescription>
      </PageHeader>
      <CommsComposer />
    </Shell>
  )
}
