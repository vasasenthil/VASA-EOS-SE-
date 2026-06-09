"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { raiseTicket, advanceTicket, deleteTicket, listTickets, type NewTicket } from "@/lib/maintenance/store"
import type { Ticket } from "@/lib/maintenance"
import { logger } from "@/lib/logger"

export async function listTicketsAction(): Promise<Ticket[]> {
  noStore()
  try {
    return await listTickets()
  } catch (e) {
    logger.error("ticket.list failed", { error: String(e) })
    return []
  }
}

export async function raiseTicketAction(input: NewTicket): Promise<Ticket | null> {
  try {
    const t = await raiseTicket(input)
    revalidatePath("/maintenance")
    return t
  } catch (e) {
    logger.error("ticket.raise failed", { error: String(e) })
    return null
  }
}

export async function advanceTicketAction(id: string): Promise<Ticket | null> {
  try {
    const t = await advanceTicket(id)
    revalidatePath("/maintenance")
    return t ?? null
  } catch (e) {
    logger.error("ticket.advance failed", { error: String(e) })
    return null
  }
}

export async function deleteTicketAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteTicket(id)
    revalidatePath("/maintenance")
    return ok
  } catch (e) {
    logger.error("ticket.delete failed", { error: String(e) })
    return false
  }
}
