import { subscribeToPlatformEvents } from "@/lib/events/outbox-dispatcher"
import type { PlatformEvent } from "@/lib/events/schemas"
import { promoteModel } from "../registry/promote-model"
import { trainDropoutRisk } from "../training/train-dropout-risk"
import { trainInspectionPriority } from "../training/train-inspection-priority"
import { trainSchemeImpact } from "../training/train-scheme-impact"
export async function handleRetrainingEvent(event: PlatformEvent): Promise<string | undefined> { if(event.eventType!=="RetrainingTriggered") return undefined; const type=event.payload.modelType; const model= type==="dropout-risk" ? await trainDropoutRisk() : type==="inspection-priority" ? await trainInspectionPriority() : await trainSchemeImpact(); if(!model.highStakes && model.metrics.f1>=0.65) await promoteModel(model.modelType,model.version,"ml-orchestrator","Auto-promoted low-stakes model after drift-triggered retraining met F1 gate"); return model.version }
export function wireRetrainingOrchestrator(): () => void { return subscribeToPlatformEvents("RetrainingTriggered", async (event) => { await handleRetrainingEvent(event) }) }
