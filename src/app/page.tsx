import { QuestionLibrary } from "@/components/question-library";
import { listQuestions } from "@/server/repository";
import samplePack from "../../examples/original-question-pack.json";
import { importPack } from "@/server/repository";

export const dynamic = "force-dynamic";
export default function Home() {
  if (!listQuestions().length) importPack(samplePack);
  const questions = listQuestions();
  return (
    <main>
      <header>
        <p className="eyebrow">INTERVIEW DOJO OS · v0.1.0</p>
        <h1>Practice the work, keep the record.</h1>
        <p>
          Offline-first technical interview rehearsal with answer versions, transparent
          self-rubrics, replay and privacy-controlled reports.
        </p>
      </header>
      <QuestionLibrary questions={questions} />
      <footer>
        <a href="/api/trends">View knowledge-topic trends (JSON)</a> ·{" "}
        <a href="/api/questions">Export local question library (JSON)</a>
      </footer>
    </main>
  );
}
