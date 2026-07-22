# Benchmark

Target workload: the committed 20-question pack, one local SQLite database, and trend calculation after 20 scored sessions. The benchmark is recorded during the release validation on the release machine because hardware and filesystem conditions affect SQLite startup time. The core operations are synchronous local database calls; no network latency is included.
