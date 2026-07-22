import { describe, expect, it } from "vitest";
import { scoreRubric, weaknessTrends } from "@/domain/scoring";
import { parseQuestionPack, type Question } from "@/domain/model";
import { elapsedSeconds, eventFor } from "@/domain/session";

const question: Question = {
  id: "test-question",
  title: "Test question",
  kind: "algorithm",
  prompt: "A sufficiently detailed prompt for testing domain calculations.",
  topics: ["arrays", "testing"],
  rubric: [
    { id: "correct", label: "Correct", weight: 3, guidance: "Is it correct?" },
    { id: "clear", label: "Clear", weight: 1, guidance: "Is it clear?" },
  ],
};
describe("rubric scoring", () => {
  it("calculates weighted scores from real criterion input", () =>
    expect(
      scoreRubric(question, [
        { criterionId: "correct", score: 4, note: "works" },
        { criterionId: "clear", score: 2, note: "brief" },
      ]),
    ).toEqual({ scorePercent: 88, scoreCount: 2 }));
  it("rejects incomplete and invalid self-scores", () => {
    expect(() =>
      scoreRubric(question, [{ criterionId: "correct", score: 5, note: "bad" }]),
    ).toThrow("Missing rubric scores");
    expect(() =>
      scoreRubric(question, [
        { criterionId: "correct", score: 4, note: "ok" },
        { criterionId: "wrong", score: 1, note: "bad" },
      ]),
    ).toThrow("Missing rubric scores");
  });
  it("orders weakness topics by low average and produces attempt counts", () =>
    expect(
      weaknessTrends([
        { topic: "API", scorePercent: 75 },
        { topic: "API", scorePercent: 25 },
        { topic: "graphs", scorePercent: 30 },
      ]),
    ).toEqual([
      { topic: "graphs", average: 30, attempts: 1 },
      { topic: "API", average: 50, attempts: 2 },
    ]));
});
describe("pack parsing and injected time", () => {
  it("rejects a malformed pack rather than accepting a placeholder", () =>
    expect(() => parseQuestionPack({ version: 1, name: "bad", questions: [] })).toThrow());
  it("creates deterministic timeline event timestamps and elapsed time", () => {
    const clock = { now: () => new Date("2026-01-01T00:02:30.000Z") };
    expect(eventFor("s1", "started", "start", clock, () => 0.1).occurredAt).toBe(
      "2026-01-01T00:02:30.000Z",
    );
    expect(elapsedSeconds("2026-01-01T00:00:00.000Z", clock.now())).toBe(150);
    expect(elapsedSeconds("2026-01-01T00:03:00.000Z", clock.now())).toBe(0);
  });
});
