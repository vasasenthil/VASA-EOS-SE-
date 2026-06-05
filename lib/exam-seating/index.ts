// VASA-EOS(SE) — examination seating & hall allocation (Flagship 05 / exam security).
// Greedy allocation of candidates across halls by capacity. Pure planning logic.

export interface Hall {
  id: string
  name: string
  capacity: number
}

export const HALLS: Hall[] = [
  { id: "H-A", name: "Hall A (Main block)", capacity: 60 },
  { id: "H-B", name: "Hall B (Science block)", capacity: 40 },
  { id: "H-C", name: "Hall C (Library annexe)", capacity: 30 },
  { id: "H-D", name: "Hall D (Auditorium)", capacity: 100 },
]

export interface Allocation {
  hall: Hall
  seats: number
}

export interface SeatingPlan {
  allocations: Allocation[]
  seated: number
  unseated: number
  totalCapacity: number
}

/** Fill halls in order until candidates are seated; report any overflow. */
export function seatingPlan(candidates: number, halls: Hall[] = HALLS): SeatingPlan {
  let remaining = Math.max(0, Math.floor(candidates))
  const totalCapacity = halls.reduce((s, h) => s + h.capacity, 0)
  const allocations: Allocation[] = halls.map((hall) => {
    const seats = Math.min(hall.capacity, remaining)
    remaining -= seats
    return { hall, seats }
  })
  const seated = allocations.reduce((s, a) => s + a.seats, 0)
  return { allocations, seated, unseated: remaining, totalCapacity }
}
