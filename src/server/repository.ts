import { parseQuestionPack, type Question, type RubricScore, type Session } from "@/domain/model";
import { eventFor, createId, systemClock, type Clock } from "@/domain/session";
import { scoreRubric, weaknessTrends } from "@/domain/scoring";
import { sqlite } from "@/server/database";

const now = (clock: Clock) => clock.now().toISOString();
export function importPack(input: unknown, clock: Clock = systemClock) {
  const pack = parseQuestionPack(input);
  const db = sqlite();
  const statement = db.prepare(
    "INSERT INTO questions (id,payload,created_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
  );
  const transaction = db.transaction(() =>
    pack.questions.forEach((question) =>
      statement.run(question.id, JSON.stringify(question), now(clock)),
    ),
  );
  transaction();
  return { imported: pack.questions.length, name: pack.name };
}
export function listQuestions(): Question[] {
  return sqlite()
    .prepare("SELECT payload FROM questions ORDER BY created_at, id")
    .all()
    .map((row) => JSON.parse((row as { payload: string }).payload) as Question);
}
export function getQuestion(id: string): Question | undefined {
  const row = sqlite().prepare("SELECT payload FROM questions WHERE id=?").get(id) as
    | { payload: string }
    | undefined;
  return row ? (JSON.parse(row.payload) as Question) : undefined;
}
export function createSession(questionId: string, clock: Clock = systemClock): Session {
  if (!getQuestion(questionId)) throw new Error("Question does not exist");
  const id = createId("ses", clock);
  const startedAt = now(clock);
  const session = { id, questionId, startedAt, completedAt: null, includeAnswerInExport: false };
  sqlite()
    .prepare(
      "INSERT INTO sessions (id,question_id,started_at,completed_at,include_answer) VALUES (?, ?, ?, ?, ?)",
    )
    .run(id, questionId, startedAt, null, 0);
  const event = eventFor(id, "started", "Session started", clock);
  sqlite()
    .prepare("INSERT INTO timeline_events VALUES (?, ?, ?, ?, ?)")
    .run(event.id, event.sessionId, event.type, event.detail, event.occurredAt);
  return session;
}
export function getSession(id: string) {
  const row = sqlite()
    .prepare(
      "SELECT id,question_id,started_at,completed_at,include_answer FROM sessions WHERE id=?",
    )
    .get(id) as
    | {
        id: string;
        question_id: string;
        started_at: string;
        completed_at: string | null;
        include_answer: number;
      }
    | undefined;
  if (!row) return undefined;
  const question = getQuestion(row.question_id);
  if (!question) throw new Error("Session question is missing");
  const answers = sqlite()
    .prepare(
      "SELECT id,session_id,content,created_at FROM answers WHERE session_id=? ORDER BY created_at",
    )
    .all(id) as Array<{ id: string; session_id: string; content: string; created_at: string }>;
  const scores = sqlite()
    .prepare("SELECT criterion_id,score,note FROM rubric_scores WHERE session_id=?")
    .all(id) as Array<{ criterion_id: string; score: number; note: string }>;
  const timeline = sqlite()
    .prepare(
      "SELECT id,session_id,type,detail,occurred_at FROM timeline_events WHERE session_id=? ORDER BY occurred_at",
    )
    .all(id) as Array<{
    id: string;
    session_id: string;
    type: "started" | "answer_saved" | "rubric_scored" | "exported";
    detail: string;
    occurred_at: string;
  }>;
  return {
    session: {
      id: row.id,
      questionId: row.question_id,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      includeAnswerInExport: Boolean(row.include_answer),
    },
    question,
    answers,
    scores: scores.map((score) => ({
      criterionId: score.criterion_id,
      score: score.score,
      note: score.note,
    })),
    timeline: timeline.map((event) => ({
      id: event.id,
      sessionId: event.session_id,
      type: event.type,
      detail: event.detail,
      occurredAt: event.occurred_at,
    })),
  };
}
export function saveAnswer(sessionId: string, content: string, clock: Clock = systemClock) {
  if (!getSession(sessionId)) throw new Error("Session does not exist");
  if (!content.trim()) throw new Error("Answer cannot be empty");
  const id = createId("ans", clock);
  const createdAt = now(clock);
  sqlite()
    .prepare("INSERT INTO answers VALUES (?, ?, ?, ?)")
    .run(id, sessionId, content, createdAt);
  const event = eventFor(sessionId, "answer_saved", `Saved answer version ${id}`, clock);
  sqlite()
    .prepare("INSERT INTO timeline_events VALUES (?, ?, ?, ?, ?)")
    .run(event.id, event.sessionId, event.type, event.detail, event.occurredAt);
  return { id, sessionId, content, createdAt };
}
export function saveRubric(sessionId: string, scores: RubricScore[], clock: Clock = systemClock) {
  const detail = getSession(sessionId);
  if (!detail) throw new Error("Session does not exist");
  const result = scoreRubric(detail.question, scores);
  const db = sqlite();
  const upsert = db.prepare(
    "INSERT INTO rubric_scores VALUES (?, ?, ?, ?) ON CONFLICT(session_id,criterion_id) DO UPDATE SET score=excluded.score,note=excluded.note",
  );
  db.transaction(() =>
    scores.forEach((score) => upsert.run(sessionId, score.criterionId, score.score, score.note)),
  )();
  db.prepare("UPDATE sessions SET completed_at=? WHERE id=?").run(now(clock), sessionId);
  const event = eventFor(
    sessionId,
    "rubric_scored",
    `Recorded transparent self-score: ${result.scorePercent}%`,
    clock,
  );
  db.prepare("INSERT INTO timeline_events VALUES (?, ?, ?, ?, ?)").run(
    event.id,
    event.sessionId,
    event.type,
    event.detail,
    event.occurredAt,
  );
  return result;
}
export function setExportPrivacy(sessionId: string, includeAnswer: boolean) {
  const result = sqlite()
    .prepare("UPDATE sessions SET include_answer=? WHERE id=?")
    .run(includeAnswer ? 1 : 0, sessionId);
  if (!result.changes) throw new Error("Session does not exist");
}
export function report(sessionId: string, clock: Clock = systemClock) {
  const detail = getSession(sessionId);
  if (!detail) throw new Error("Session does not exist");
  const score = detail.scores.length ? scoreRubric(detail.question, detail.scores) : null;
  const answer = detail.session.includeAnswerInExport
    ? (detail.answers.at(-1)?.content ?? null)
    : null;
  const event = eventFor(
    sessionId,
    "exported",
    detail.session.includeAnswerInExport
      ? "Exported report with selected answer"
      : "Exported report without local answer",
    clock,
  );
  sqlite()
    .prepare("INSERT INTO timeline_events VALUES (?, ?, ?, ?, ?)")
    .run(event.id, event.sessionId, event.type, event.detail, event.occurredAt);
  return {
    generatedAt: now(clock),
    question: {
      id: detail.question.id,
      title: detail.question.title,
      topics: detail.question.topics,
    },
    session: { startedAt: detail.session.startedAt, completedAt: detail.session.completedAt },
    rubric: { transparent: true, selfAssessmentOnly: true, score },
    answer,
    timeline: detail.timeline,
  };
}
export function trends() {
  const rows = sqlite()
    .prepare(
      "SELECT q.payload, r.score FROM sessions s JOIN questions q ON q.id=s.question_id JOIN (SELECT session_id, AVG(score)*25 AS score FROM rubric_scores GROUP BY session_id) r ON r.session_id=s.id",
    )
    .all() as Array<{ payload: string; score: number }>;
  return weaknessTrends(
    rows.flatMap((row) =>
      (JSON.parse(row.payload) as Question).topics.map((topic) => ({
        topic,
        scorePercent: Math.round(row.score),
      })),
    ),
  );
}
