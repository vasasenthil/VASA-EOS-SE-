export interface FairnessMetric { group: string; metric: string; value: number; threshold: number; pass: boolean }
export interface ModelCardInput { modelId: string; modelType: string; version: string; intendedUse: string; limitations: string[]; metrics: Record<string, number>; fairness: FairnessMetric[]; trainingDataWindow: string }

export function generateModelCard(input: ModelCardInput): string {
  const fairness = input.fairness.map((f) => `| ${f.group} | ${f.metric} | ${f.value} | ${f.threshold} | ${f.pass ? "Pass" : "Review"} |`).join("\n")
  return `# Model Card: ${input.modelType} ${input.version}\n\n` +
    `- **Model ID:** ${input.modelId}\n` +
    `- **Intended use:** ${input.intendedUse}\n` +
    `- **Training data window:** ${input.trainingDataWindow}\n\n` +
    `## Metrics\n${Object.entries(input.metrics).map(([k, v]) => `- ${k}: ${v}`).join("\n")}\n\n` +
    `## Fairness\n| Group | Metric | Value | Threshold | Status |\n|---|---:|---:|---:|---|\n${fairness}\n\n` +
    `## Limitations\n${input.limitations.map((item) => `- ${item}`).join("\n")}\n`
}
