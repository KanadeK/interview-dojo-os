import { afterEach, describe, expect, it } from "vitest";
import { closeDatabaseForTests } from "@/server/database";
import {
  createSession,
  getSession,
  importPack,
  report,
  saveAnswer,
  saveRubric,
  setExportPrivacy,
  trends,
} from "@/server/repository";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let directory = "";
const clock = { now: () => new Date("2026-07-22T08:00:00.000Z") };
function setDatabase() {
  directory = mkdtempSync(join(tmpdir(), "dojo-test-"));
  process.env.INTERVIEW_DOJO_DB_PATH = join(directory, "dojo.db");
}
const pack = {
  version: 1 as const,
  name: "test pack",
  questions: [
    {
      id: "question-one",
      title: "Question one",
      kind: "algorithm" as const,
      prompt: "Explain a complete solution in enough detail for this repository test.",
      topics: ["arrays"],
      rubric: [
        { id: "correct", label: "Correct", weight: 2, guidance: "Correct behavior." },
        { id: "clear", label: "Clear", weight: 1, guidance: "Clear explanation." },
      ],
    },
  ],
};
afterEach(() => {
  closeDatabaseForTests();
  if (directory) rmSync(directory, { recursive: true, force: true });
  delete process.env.INTERVIEW_DOJO_DB_PATH;
});
describe("SQLite repository", () => {
  it("persists answer versions, rubric and timeline across a database reopen", () => {
    setDatabase();
    expect(importPack(pack, clock)).toEqual({ imported: 1, name: "test pack" });
    const session = createSession("question-one", clock);
    saveAnswer(session.id, "const answer = solve(input);", clock);
    saveRubric(
      session.id,
      [
        { criterionId: "correct", score: 4, note: "valid" },
        { criterionId: "clear", score: 3, note: "readable" },
      ],
      clock,
    );
    closeDatabaseForTests();
    const persisted = getSession(session.id);
    expect(persisted?.answers[0]?.content).toContain("solve");
    expect(persisted?.scores).toHaveLength(2);
    expect(persisted?.timeline.map((event) => event.type)).toEqual([
      "started",
      "answer_saved",
      "rubric_scored",
    ]);
  });
  it("excludes answer text from a report until the learner explicitly chooses it", () => {
    setDatabase();
    importPack(pack, clock);
    const session = createSession("question-one", clock);
    saveAnswer(session.id, "private local implementation", clock);
    saveRubric(
      session.id,
      [
        { criterionId: "correct", score: 2, note: "partial" },
        { criterionId: "clear", score: 1, note: "unclear" },
      ],
      clock,
    );
    expect(report(session.id, clock).answer).toBeNull();
    setExportPrivacy(session.id, true);
    expect(report(session.id, clock).answer).toBe("private local implementation");
    expect(trends()).toEqual([{ topic: "arrays", average: 38, attempts: 1 }]);
  });
  it("rejects missing question, empty answers and unknown sessions", () => {
    setDatabase();
    importPack(pack, clock);
    expect(() => createSession("unknown", clock)).toThrow("Question does not exist");
    const session = createSession("question-one", clock);
    expect(() => saveAnswer(session.id, "", clock)).toThrow("Answer cannot be empty");
    expect(() => setExportPrivacy("missing", true)).toThrow("Session does not exist");
  });
});
