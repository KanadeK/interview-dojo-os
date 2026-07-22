import type { Question, RubricScore } from "@/domain/model";

export function scoreRubric(question: Question, scores: RubricScore[]) {
  const byCriterion = new Map(scores.map((score) => [score.criterionId, score]));
  const missing = question.rubric
    .filter((criterion) => !byCriterion.has(criterion.id))
    .map((criterion) => criterion.id);
  if (missing.length) throw new Error(`Missing rubric scores: ${missing.join(", ")}`);
  const invalid = scores.find(
    (score) =>
      score.score < 0 ||
      score.score > 4 ||
      !question.rubric.some((criterion) => criterion.id === score.criterionId),
  );
  if (invalid) throw new Error("Rubric scores must target known criteria and be between 0 and 4");
  const totalWeight = question.rubric.reduce((sum, criterion) => sum + criterion.weight, 0);
  const points = question.rubric.reduce(
    (sum, criterion) => sum + criterion.weight * (byCriterion.get(criterion.id)?.score ?? 0),
    0,
  );
  return {
    scorePercent: Math.round((points / (totalWeight * 4)) * 100),
    scoreCount: scores.length,
  };
}

export function weaknessTrends(rows: Array<{ topic: string; scorePercent: number }>) {
  const aggregate = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    const current = aggregate.get(row.topic) ?? { total: 0, count: 0 };
    current.total += row.scorePercent;
    current.count += 1;
    aggregate.set(row.topic, current);
  }
  return [...aggregate.entries()]
    .map(([topic, value]) => ({
      topic,
      average: Math.round(value.total / value.count),
      attempts: value.count,
    }))
    .sort((a, b) => a.average - b.average || b.attempts - a.attempts);
}
