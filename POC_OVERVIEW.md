## POC Review Summary

### Overview
- Client stores chat history; full conversation context sent each turn.
- Summary is a multi-step agentic flow with retries.
- Persisted entities use a loose schema to accommodate variable asset JSON.

### Architecture Decisions (POC)

1) Node.js over Python for backend
- Status: Accepted (POC)
- Context: Small set of endpoints; simple agentic flow.
- Rationale: Fast prototyping in JS/TS; LangChain.js feature coverage is sufficient; Bun + Hono provide quick startup and good perf; can co-locate with frontend for speed.
- Trade-offs: Smaller Python ecosystem for data tooling; potential parity gaps with Python-first LLM libs.
- Revisit when: We need Python-specific libraries, heavier data processing, or see feature gaps in LangChain.js/LangGraph.js.

2) MongoDB over PostgreSQL
- Status: Accepted (POC)
- Context: Asset JSON may vary across sources; schema might evolve.
- Rationale: Flexible JSON-first model without rigid migrations enables faster iteration.
- Trade-offs: Weaker relational guarantees; looser validation can hide data issues.
- Revisit when: Schemas stabilize, cross-entity relationships grow, or stronger transactional guarantees are required.

3) File uploads via pre-signed URLs (browser direct)
- Status: Accepted (POC)
- Context: No long-term need to store raw files once parsed.
- Rationale: Keep API stateless for uploads; use temporary storage with TTL; simpler and faster path for the POC.
- Trade-offs: Extra moving part (temp bucket); must manage TTL, access control, and cleanup.
- Revisit when: Moving to production—use pre-signed URLs (e.g., S3), enforce size limits, virus scanning, and provenance logging.

4) No asset history/versioning
- Status: Accepted (POC)
- Context: Optimize for iteration speed; summaries operate on current state.
- Rationale: Avoid complexity of versioning and migrations in early POC.
- Trade-offs: No audit trail or diffing over time; harder to reproduce results.
- Revisit when: We need auditing, time-based analyses, or rollback/diff features.

### Known Risks and Limitations
Security and Access Control
- No authentication/authorization on read/write endpoints.
- No rate limiting/throttling or abuse protection.
- CORS policy not explicitly defined; risk of over-permissive defaults.
- No CSRF protections for state-changing requests (if browser + cookies are used).

API Design and Request Validation
- Loose schema validation for request bodies and params (IDs, pagination, filters).
- No pagination/sorting/filtering on list endpoints (risk of large payloads).
- No explicit request timeouts or body size limits (should return 413 for oversized bodies).

Ingestion and Data Handling
- No MIME/content-type enforcement for uploads or JSON ingestion.
- No streaming/chunked parsing for large payloads (memory pressure).
- No idempotency keys/deduplication for repeated submissions.
- No per-user/tenant quotas on ingestion or asset counts.

LLM-Specific Concerns
- No budget controls (token caps per request/user/day) or vendor-side rate limiting.
- No circuit breaker/timeout/backoff around LLM calls; risk of cascading failures.
- No content moderation/safety filtering on inputs/outputs.
- Missing token-window management (history pruning/relevance) for long chats.
- Limited output validation/guardrails for free-form responses.

Data Model and Persistence
- Potential duplicates without uniqueness constraints/deduplication strategy.
- Some risk of orphaned data (e.g., summaries left behind on delete).
- Missing explicit indexes for common queries; potential full scans at scale.
- No schema versioning/evolution strategy on persisted documents.
- No data retention policy or TTL for transient data.
- Possible mass-assignment risk when persisting models (unvalidated/extra fields).
- Last-write-wins semantics; no optimistic locking or concurrency controls.
- Trusting client-supplied IDs can cause collisions or unauthorized overwrites.

Reliability and Operations
- Background job orchestration durability unclear (no persistent queue/DLQ/backoff).
- No tracing/metrics instrumentation for latency, error rates, or external calls.
- No structured alerting or SLO/error budget policy.

Configuration and Secrets
- No strict runtime config validation with fail-fast on missing/invalid env vars.
- Secrets management/rotation policy undefined; risk of leaking keys in logs.
- No clear separation of environment-specific configs (dev/stage/prod).

Testing and Quality
- No deterministic tests for LLM behavior (mocks/fixtures, snapshotting).
- No load/performance tests for large datasets and list endpoints.
- No fuzz/property-based tests for ingestion and parsing.
- Limited fault-injection/chaos testing for external dependencies.

Compliance, Privacy, and Audit
- No data PII handling policy.
- No provenance tracking for uploaded data (source metadata, checksums).
- No encryption-at-rest/transport documentation or key rotation policy.

Performance and Scalability
- Unbounded list queries and responses (lack of pagination and projections).
- Potential N+1 or redundant fetches without caching.

Documentation and Process
- Lightweight API contracts and error schemas.

### If I Had More Time (Next Steps)
- Add PII redaction before LLM calls.
- Synthesize additional samples from existing data and docs.
- Implement prompt/chain evaluations.
- Implement timeouts, retries with backoff, and body size limits.
- Add LLM budget caps, circuit breakers, and prompt versioning.
- Move long-running work to async jobs (e.g., SQS or similar).
- Define indexes, uniqueness constraints, and retention/TTL where appropriate.
- Add app observability (DataDog/New Relic) and LLM observability (LangSmith/W&B/Neptune/Helicone).
- Add alerting (Sentry).
- Externalize/manage prompts (PromptLayer/Freeplay).
- Explore tool calling for enrichment:
  - Certificate checks
  - Extra data for suspicious points
  - Access to external services
- Explore RAG if good summary exemplars are available.

### Capabilities (hopefully) Demonstrated
- Engineering
  - RESTful API design (Hono)
  - Separation of concerns; MVC-style structure
  - DTOs vs storable entities
  - Persistence
  - Input validation
  - Error handling
- Frontend
  - Functional, semi-polished UI
  - API integration
- Agentic/LLM
  - Single-turn chat agent (LangChain)
  - Multi-step orchestration for summary + validation (LangGraph)
  - Prompt templating and context design strategies
- Python and experimentation via notebooks
  - Problem isolation in a notebook
  - Iterative improvement
  - Deployment back into the app

### Out of Scope / Not Demonstrated
- Vectors/embeddings
- RAG implementation
- Synthetic data generation
