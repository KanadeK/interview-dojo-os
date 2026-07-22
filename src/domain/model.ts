import { z } from "zod";

export const CriterionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  weight: z.number().positive(),
  guidance: z.string().min(1),
});
export const QuestionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  kind: z.enum(["algorithm", "debugging", "api-design", "system-design"]),
  prompt: z.string().min(20),
  topics: z.array(z.string().min(1)).min(1),
  rubric: z.array(CriterionSchema).min(2),
});
export const QuestionPackSchema = z.object({
  version: z.literal(1),
  name: z.string().min(1),
  questions: z.array(QuestionSchema).min(1),
});
export type Criterion = z.infer<typeof CriterionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionPack = z.infer<typeof QuestionPackSchema>;

export type AnswerVersion = { id: string; sessionId: string; content: string; createdAt: string };
export type TimelineEvent = {
  id: string;
  sessionId: string;
  type: "started" | "answer_saved" | "rubric_scored" | "exported";
  occurredAt: string;
  detail: string;
};
export type RubricScore = { criterionId: string; score: number; note: string };
export type Session = {
  id: string;
  questionId: string;
  startedAt: string;
  completedAt: string | null;
  includeAnswerInExport: boolean;
};

export function parseQuestionPack(input: unknown): QuestionPack {
  return QuestionPackSchema.parse(input);
}
