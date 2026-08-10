// VASA-EOS(SE) — in-process event bus seam.
//
// A deterministic platform event bus abstraction used by modules that need
// publish/subscribe semantics without binding the application to Kafka at test
// time. Production can bridge EventBus.publish() to Kafka/NATS; the application
// contract is fully built and unit-testable here.

export interface PlatformEvent<T = Record<string, unknown>> {
  id: string
  topic: string
  type: string
  payload: T
  at: string
}

export type EventHandler = (event: PlatformEvent<unknown>) => void | Promise<void>

export interface PublishInput<T = Record<string, unknown>> {
  topic: string
  type: string
  payload: T
  at?: string
}

export interface EventBus {
  publish<T = Record<string, unknown>>(input: PublishInput<T>): Promise<PlatformEvent<T>>
  subscribe(topic: string, handler: EventHandler): () => void
  replay(topic?: string): PlatformEvent[]
}

function eventId(topic: string, type: string, sequence: number): string {
  return `evt-${topic.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}-${type.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}-${String(sequence).padStart(6, "0")}`
}

export function createEventBus(now: () => string = () => new Date().toISOString()): EventBus {
  const events: PlatformEvent[] = []
  const handlers = new Map<string, Set<EventHandler>>()

  return {
    async publish<T = Record<string, unknown>>(input: PublishInput<T>): Promise<PlatformEvent<T>> {
      if (!input.topic.trim()) throw new Error("Event topic is required")
      if (!input.type.trim()) throw new Error("Event type is required")
      const event: PlatformEvent<T> = {
        id: eventId(input.topic, input.type, events.length + 1),
        topic: input.topic,
        type: input.type,
        payload: input.payload,
        at: input.at ?? now(),
      }
      events.push(event as PlatformEvent)
      for (const handler of handlers.get(input.topic) ?? []) await handler(event as PlatformEvent<unknown>)
      return event
    },
    subscribe(topic: string, handler: EventHandler): () => void {
      if (!topic.trim()) throw new Error("Event topic is required")
      const set = handlers.get(topic) ?? new Set<EventHandler>()
      set.add(handler)
      handlers.set(topic, set)
      return () => set.delete(handler)
    },
    replay(topic?: string): PlatformEvent[] {
      return events.filter((event) => !topic || event.topic === topic).map((event) => ({ ...event }))
    },
  }
}

export const platformEventBus = createEventBus()
