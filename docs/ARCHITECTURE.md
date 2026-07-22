# Architecture

```
Browser UI → Next route adapter → repository → SQLite
                     ↓
              domain validation/scoring/time
```

`src/domain` contains Zod pack validation, weighted scoring, trend aggregation and clock-injected session helpers. It has no React, database or network dependency.

`src/server/database.ts` creates the local SQLite schema and exposes a Drizzle-backed connection boundary. `src/server/repository.ts` owns transactional persistence: questions, sessions, answer versions, rubric scores and timeline events. Routes translate HTTP input and errors; client components only call routes.

The local database uses WAL mode. A session is complete after a rubric is saved. Every start, answer save, rubric save and report generation appends a timeline event. This makes the replay record auditable without interpreting it as an employment assessment.
