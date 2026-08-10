import assert from "node:assert/strict"
import test from "node:test"
import { dispatchOutboxBatch, resetDispatcherState } from "@/lib/events/outbox-dispatcher"
import { listOutboxEvents, resetMemoryOutbox } from "@/lib/events/outbox-publisher"
import { extractInspectionFeatures } from "@/lib/ml/features/inspection-features"
import { extractSchemeFeatures } from "@/lib/ml/features/scheme-features"
import { extractStudentFeatures } from "@/lib/ml/features/student-features"
import { populationStabilityIndex } from "@/lib/ml/drift/psi"
import { ksTest } from "@/lib/ml/drift/ks-test"
import { collectOutcome } from "@/lib/ml/feedback/outcome-collector"
import { predictDropoutRisk } from "@/lib/ml/inference/dropout-risk-service"
import { predictInspectionPriority } from "@/lib/ml/inference/inspection-priority-service"
import { listDriftReports, listModels, listPredictions, resetMLStore } from "@/lib/ml/store"
import { promoteModel } from "@/lib/ml/registry/promote-model"
import { rollbackModel } from "@/lib/ml/registry/rollback-model"
import { trainDropoutRisk } from "@/lib/ml/training/train-dropout-risk"
import { trainInspectionPriority } from "@/lib/ml/training/train-inspection-priority"
import { syntheticInspectionTrainingData, syntheticStudentTrainingData } from "@/lib/ml/training/synthetic-data"
import { runDriftMonitor } from "@/lib/ml/workers/drift-monitor.worker"
import { handleRetrainingEvent, wireRetrainingOrchestrator } from "@/lib/ml/workers/retraining-orchestrator"

test.beforeEach(() => { resetMLStore(); resetMemoryOutbox(); resetDispatcherState() })

test("feature extraction returns bounded typed feature vectors", () => {
  assert.equal(extractStudentFeatures({attendancePct:80,assessmentAverage:70}).attendancePct, 0.8)
  assert.equal(extractInspectionFeatures({infrastructureScore:50,teacherStudentRatio:40,pastInspectionScore:60,complianceFindings:3,safetyIncidents:2,attendancePct:90}).complianceFindings, 0.06)
  assert.equal(extractSchemeFeatures({budgetUtilizationPct:75,beneficiaryCount:50,targetPopulation:100,districtsCovered:19,equityIndex:60,priorOutcomeScore:70}).beneficiaryCoverage, 0.5)
})

test("drift detectors detect injected distribution drift", () => {
  const baseline = Array.from({length:100},(_,i)=>i/100)
  const shifted = Array.from({length:100},(_,i)=>0.8+i/500)
  assert.equal(populationStabilityIndex(baseline, shifted).severity, "critical")
  assert.equal(ksTest(baseline, shifted).severity, "critical")
})

test("training registers models and inference logs predictions", async () => {
  const model = await trainDropoutRisk(syntheticStudentTrainingData(120))
  await promoteModel("dropout-risk", model.version, "qa", "test promotion")
  const prediction = await predictDropoutRisk({attendancePct:58,assessmentAverage:42,assignmentCompletionPct:55,consecutiveAbsences:12,feeDefaultDays:80,engagementEvents:8})
  assert.ok(prediction?.predictionId)
  assert.equal((await listPredictions("dropout-risk")).length, 1)
  const events = (await listOutboxEvents()).map((row) => row.event.eventType)
  assert.ok(events.includes("ModelTrained"))
  assert.ok(events.includes("ModelPromoted"))
  assert.ok(events.includes("PredictionMade"))
})

test("outcome collection closes feedback loop and drift monitor emits retraining", async () => {
  const model = await trainInspectionPriority(syntheticInspectionTrainingData(120))
  await promoteModel("inspection-priority", model.version, "qa", "test promotion")
  for (let i=0;i<12;i++) {
    const p = await predictInspectionPriority({infrastructureScore:95,teacherStudentRatio:18,pastInspectionScore:92,complianceFindings:0,safetyIncidents:0,attendancePct:96})
    assert.ok(p)
    await collectOutcome({predictionId:p.predictionId, actualOutcome:1, groundTruthSource:`inspection-completed-${i}`})
  }
  const result = await runDriftMonitor(new Date("2026-07-16T00:00:00.000Z"))
  assert.ok(result.drift >= 1)
  assert.ok((await listDriftReports("inspection-priority")).length >= 1)
  assert.ok((await listOutboxEvents()).some((row) => row.event.eventType === "RetrainingTriggered"))
})

test("retraining orchestrator trains and auto-promotes low-stakes model", async () => {
  const unsubscribe = wireRetrainingOrchestrator()
  const model = await trainInspectionPriority(syntheticInspectionTrainingData(120))
  await promoteModel("inspection-priority", model.version, "qa", "initial")
  for (let i=0;i<10;i++) {
    const p = await predictInspectionPriority({infrastructureScore:95,teacherStudentRatio:18,pastInspectionScore:92,complianceFindings:0,safetyIncidents:0,attendancePct:96})
    await collectOutcome({predictionId:p!.predictionId, actualOutcome:1, groundTruthSource:`inspection-outcome-${i}`})
  }
  await runDriftMonitor(new Date("2026-07-16T00:00:00.000Z"))
  await dispatchOutboxBatch({workerId:"ml-test",batchSize:50})
  const active = (await listModels("inspection-priority")).filter((m) => m.status === "active")
  assert.equal(active.length, 1)
  assert.notEqual(active[0].version, model.version)
  unsubscribe()
})

test("manual promotion and rollback change active versions", async () => {
  const first = await trainInspectionPriority(syntheticInspectionTrainingData(80))
  await promoteModel("inspection-priority", first.version, "qa", "first")
  const second = await trainInspectionPriority(syntheticInspectionTrainingData(81))
  await promoteModel("inspection-priority", second.version, "qa", "second")
  await rollbackModel("inspection-priority", "regression detected")
  const active = (await listModels("inspection-priority")).find((m) => m.status === "active")
  assert.equal(active?.version, first.version)
})
