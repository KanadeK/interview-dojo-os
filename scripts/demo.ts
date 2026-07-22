import pack from "../examples/original-question-pack.json";
import {
  importPack,
  createSession,
  saveAnswer,
  saveRubric,
  report,
} from "../src/server/repository";
import { closeDatabaseForTests } from "../src/server/database";
import { mkdirSync, writeFileSync } from "node:fs";

process.env.INTERVIEW_DOJO_DB_PATH = ".tmp/demo.db";
importPack(pack);
const session = createSession(pack.questions[0].id);
saveAnswer(session.id, "Use a map of values seen so far; each arrival checks target - value.");
saveRubric(
  session.id,
  pack.questions[0].rubric.map((criterion) => ({
    criterionId: criterion.id,
    score: 3,
    note: "Demo self-assessment",
  })),
);
mkdirSync("dist-release", { recursive: true });
writeFileSync("dist-release/demo-report.json", JSON.stringify(report(session.id), null, 2));
closeDatabaseForTests();
console.log("Generated dist-release/demo-report.json from the committed sample pack.");
