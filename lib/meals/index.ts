// VASA-EOS(SE) — PM POSHAN / CMBS daily meal operations (Flagship 02).
// Menu planning (nutrition + budget + variety, FSSAI norms), GeM procurement,
// and daily reconciliation of meals served vs attendance (leakage detection),
// with mother-committee oversight. Pure deterministic engine for the demo; the
// AI menu planner + IoT cold chain + GeM procurement run via the adapter seams.

export interface MealItem {
  name: string
  calories: number
}

export interface DayMenu {
  day: string
  breakfast: MealItem[] // CMBS
  lunch: MealItem[] // PM POSHAN
  egg: boolean
}

export interface NutritionSummary {
  calories: number
  meetsFssai: boolean
}

// FSSAI / PM POSHAN norm (upper primary) — illustrative daily calorie floor.
const FSSAI_CALORIE_FLOOR = 700

const WEEK: DayMenu[] = [
  { day: "Monday", breakfast: [{ name: "Pongal", calories: 250 }], lunch: [{ name: "Sambar rice", calories: 450 }, { name: "Poriyal", calories: 120 }], egg: true },
  { day: "Tuesday", breakfast: [{ name: "Idli + sambar", calories: 240 }], lunch: [{ name: "Curd rice", calories: 400 }, { name: "Kootu", calories: 130 }], egg: false },
  { day: "Wednesday", breakfast: [{ name: "Upma", calories: 230 }], lunch: [{ name: "Tomato rice", calories: 430 }, { name: "Rasam", calories: 90 }], egg: true },
  { day: "Thursday", breakfast: [{ name: "Rava kichadi", calories: 260 }], lunch: [{ name: "Lemon rice", calories: 420 }, { name: "Poriyal", calories: 120 }], egg: false },
  { day: "Friday", breakfast: [{ name: "Pongal", calories: 250 }], lunch: [{ name: "Vegetable biryani", calories: 480 }, { name: "Raita", calories: 110 }], egg: true },
]

export function planWeeklyMenu(): DayMenu[] {
  return WEEK
}

export function summarizeNutrition(menu: DayMenu): NutritionSummary {
  const calories =
    menu.breakfast.reduce((s, m) => s + m.calories, 0) +
    menu.lunch.reduce((s, m) => s + m.calories, 0) +
    (menu.egg ? 80 : 0)
  return { calories, meetsFssai: calories >= FSSAI_CALORIE_FLOOR }
}

export interface ProcurementLine {
  item: string
  source: "GeM" | "TN Civil Supplies"
  status: "ordered" | "in_transit" | "delivered"
  coldChain?: boolean
}

export function procurementStatus(): ProcurementLine[] {
  return [
    { item: "Rice (PDS allocation)", source: "TN Civil Supplies", status: "delivered" },
    { item: "Vegetables", source: "GeM", status: "in_transit" },
    { item: "Eggs", source: "GeM", status: "delivered", coldChain: true },
    { item: "Dairy (curd)", source: "GeM", status: "in_transit", coldChain: true },
  ]
}

export interface ReconResult {
  date: string
  attendance: number
  mealsServed: number
  variance: number
  leakageFlag: boolean
  note: string
}

/** Reconcile meals served against verified attendance; flag potential leakage. */
export function reconcile(input: { date: string; attendance: number; mealsServed: number }): ReconResult {
  const variance = input.mealsServed - input.attendance
  const threshold = Math.ceil(input.attendance * 0.05) // >5% over attendance
  const leakageFlag = variance > threshold
  const note = leakageFlag
    ? "Meals served exceed attendance beyond tolerance — review for leakage."
    : variance < 0
      ? "Fewer meals than present — check shortfall/absentee reconciliation."
      : "Within tolerance."
  return { ...input, variance, leakageFlag, note }
}

export const MOTHER_COMMITTEE_CHECKLIST: string[] = [
  "Hygiene of kitchen & utensils verified",
  "Egg distribution recorded (day-wise)",
  "Quantity & quality of meal checked",
  "Cook attendance confirmed",
  "Any hygiene incident reported",
]
