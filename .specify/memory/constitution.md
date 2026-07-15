<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0
Bump rationale: MINOR — three new NON-NEGOTIABLE principles added (V, VI, VII).
                No existing principle was removed or redefined, so this is an
                additive amendment rather than a MAJOR bump.

Modified principles:
  - None renamed or redefined.

Added sections:
  - V. Static Generation & Deployment (NON-NEGOTIABLE)
  - VI. Versioned Content in Git (NON-NEGOTIABLE)
  - VII. Git-Based Content Management, No Runtime Backend (NON-NEGOTIABLE)

Removed sections:
  - None.

Templates requiring updates:
  - ✅ .specify/templates/plan-template.md — "Constitution Check" references the
       constitution generically; the /speckit-plan gate will now derive from
       seven principles. No structural edit required.
  - ✅ .specify/templates/spec-template.md — no principle-specific sections; no
       edits required.
  - ✅ .specify/templates/tasks-template.md — task categorization already covers
       the concerns introduced (build/deploy, content, infra); no edits required.
  - ✅ .specify/templates/checklist-template.md — generic scaffold; no edits.
  - ⚠ CLAUDE.md AND specs/001-wine-catalogue/plan.md — CONFLICT. Both describe a
       Preact island app that persists all wine entries and images in IndexedDB
       (via `idb`), which directly VIOLATES Principle VI (no IndexedDB /
       localStorage / sessionStorage for content or images) and is inconsistent
       with Principles V and VII (static generation, git-based CMS, no runtime
       backend). These artifacts MUST be reconciled with this constitution
       before further planning or implementation.

Follow-up TODOs:
  - RECONCILE the active feature (001-wine-catalogue): its documented stack
    contradicts Principles V–VII. Re-run /speckit-plan (and revise CLAUDE.md)
    so content and images are stored as versioned files managed by a git-based
    CMS on a statically generated, statically deployed site.
-->

# My Spec Project Constitution

## Core Principles

### I. Code Quality

Code MUST be readable, maintainable, and consistent before it is clever. Every
change MUST pass automated linting and formatting in CI; merges that bypass
these checks are prohibited. Public APIs and exported symbols MUST be
documented with intent (the "why"), not just signatures. Functions and modules
MUST follow single-responsibility; cyclomatic complexity, duplication, and
dead code MUST be monitored, and any threshold breach MUST be justified in the
pull request or refactored before merge. Code reviews are mandatory and MUST
verify clarity, naming, and the absence of unused abstractions.

**Rationale**: Code is read far more often than it is written. Optimizing for
the reader compounds across every future change; tolerating drift here makes
every other principle harder to enforce.

### II. Testing Standards (NON-NEGOTIABLE)

Test-Driven Development is mandatory for new behavior: tests are written
first, MUST fail, then implementation makes them pass (Red-Green-Refactor).
Each user-facing capability MUST have unit tests for logic, integration tests
for cross-component contracts, and at least one end-to-end test for the
critical path. New code MUST meet or exceed 80% line coverage; code touching
authentication, authorization, payments, or data integrity MUST reach 100%
branch coverage. Tests MUST be deterministic, isolated, and fast — flaky
tests are bugs and MUST be fixed or deleted, never retried into green. No
production code may merge while its tests are skipped, quarantined, or
commented out without a linked tracking issue and a removal date.

**Rationale**: Tests are the executable specification of intended behavior.
Without enforced standards they become decorative; with them they become the
fastest way to ship safely.

### III. User Experience Consistency

All user-facing surfaces MUST conform to a single design system: shared
components, typography, spacing, color tokens, iconography, and motion. The
same action MUST use the same terminology, the same affordance, and the same
location across every screen, locale, and channel. Error states, empty
states, loading states, and confirmation flows MUST follow documented
patterns; ad-hoc variations require explicit design review. Accessibility is
a baseline, not an enhancement: WCAG 2.1 AA compliance (keyboard navigation,
contrast, focus order, screen reader labels) MUST be verified before any
user-facing change merges. Breaking changes to established interaction
patterns MUST be validated with user research and rolled out with migration
guidance.

**Rationale**: Consistency turns first-time users into experts and lowers
cognitive load on every interaction. Drift accumulates silently and is
expensive to undo once shipped.

### IV. Performance Requirements

Every user-facing feature MUST declare a performance budget before
implementation: target p95 and p99 latency, throughput, memory ceiling, and
(for web/mobile) bundle size and Time to Interactive. Budgets MUST be
asserted by automated benchmarks running in CI; a regression greater than 5%
against the budget blocks merge until justified or fixed. Interactive
operations MUST feel instantaneous (<100ms) or provide visible progress
within 1s; long-running operations MUST be cancellable and resumable where
feasible. Performance MUST be measured under realistic conditions —
throttled networks, mid-tier devices, representative data volumes — not just
on developer machines. Profiling data MUST accompany any change that
introduces or removes a hot path.

**Rationale**: Performance is a feature users feel before they can name.
Budgets caught early in CI cost a fraction of what they cost after launch,
and "we'll optimize later" almost never survives contact with shipping.

### V. Static Generation & Deployment (NON-NEGOTIABLE)

The site MUST be produced as a fully static artifact at build time and deployed
as static assets. There MUST be no server-side runtime that renders or serves
content on demand: no application server, no serverless request handlers that
generate content, no runtime database queries in the request path. All routes
and pages MUST be resolvable as pre-generated files servable by any static host
or CDN. Any dynamic behavior MUST run client-side only, within the constraints
of the other principles, and MUST NOT require a bespoke backend to function.

**Rationale**: A static site has the smallest possible attack surface, the
lowest operating cost, and the strongest availability and reproducibility
guarantees. Committing to static generation up front prevents the gradual
creep toward a runtime backend that would undermine Principles VI and VII.

### VI. Versioned Content in Git (NON-NEGOTIABLE)

All content, INCLUDING images, MUST be persisted as version-controlled files in
the git repository. Using databases, IndexedDB, `localStorage`, or
`sessionStorage` to persist content or images is PROHIBITED. Content changes
MUST be expressed as commits so that history, review, rollback, and provenance
are available for every piece of content. Client-side storage MAY be used only
for ephemeral, non-authoritative UI state (e.g. transient preferences) that can
be lost without any content being lost; it MUST NEVER be the system of record
for content or images.

**Rationale**: Git is the single source of truth for this project. Storing
content as versioned files makes every change auditable, reviewable, and
reversible, and keeps content reproducible from the repository alone — a
guarantee that browser-local or database storage cannot provide.

### VII. Git-Based Content Management, No Runtime Backend (NON-NEGOTIABLE)

Content management MUST be performed through a git-based CMS whose edits result
in commits to the repository. There MUST be no runtime server backend that owns,
mutates, or serves content independently of git. Editorial workflows (create,
update, delete, review) MUST flow through the git-based CMS and its commit
history; content MUST NOT be mutated out-of-band by any always-on service.

**Rationale**: A git-based CMS keeps authoring aligned with Principles V and VI:
every editorial action becomes a reviewable commit, no runtime infrastructure
must be operated or secured, and the deployed site can always be rebuilt
deterministically from the repository.

## Additional Constraints & Standards

- **Security baseline**: Dependencies MUST be scanned on every build;
  known-vulnerable versions block merge. Secrets MUST NOT appear in source
  control, logs, or error messages. Authentication state MUST follow the
  agreed token storage model (no credentials in `localStorage`).
- **Dependency hygiene**: New runtime dependencies MUST be justified in the
  PR description (problem solved, alternatives considered, maintenance
  status). Major version bumps require a migration note.
- **Observability**: Every service-level operation MUST emit structured logs
  with a correlation ID, and every performance budget MUST have a
  corresponding production metric so regressions are detectable in real
  traffic, not only in CI.
- **Documentation**: User-facing changes MUST update the relevant docs in
  the same PR. Architectural decisions MUST be recorded as ADRs when they
  affect more than one module or constrain future choices.

## Development Workflow & Quality Gates

- **Specification first**: Non-trivial work MUST follow the Spec Kit flow —
  `/speckit-specify` → `/speckit-clarify` (when needed) → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`. Skipping steps requires explicit
  justification in the PR.
- **Constitution Check gate**: Every plan MUST include a Constitution Check
  section enumerating how each of the seven principles is satisfied or, if
  violated, why the violation is unavoidable and how it is mitigated.
- **Pull request review**: At least one reviewer MUST sign off; reviewers
  MUST verify the seven principles, not just functional correctness.
  Unjustified complexity is grounds for rejection.
- **CI gates**: Lint, format, unit tests, integration tests, security scan,
  and performance benchmarks MUST all pass before merge. No `--no-verify`,
  no skipped hooks, no force-pushes to protected branches.
- **Manual deploys**: Deployments are manual and require the deployer to
  confirm the release notes accurately describe the user-visible change.

## Governance

This constitution supersedes ad-hoc practices and individual preferences.
When a team norm conflicts with a principle here, the principle wins until
the constitution is amended.

- **Amendments** MUST be proposed via pull request modifying this file. The
  PR description MUST state the rationale, the version bump
  (MAJOR / MINOR / PATCH per the rules below), and any migration plan for
  dependent artifacts.
- **Versioning policy**:
  - **MAJOR**: Backward-incompatible removal or redefinition of a principle
    or governance rule.
  - **MINOR**: New principle or section added, or material expansion of an
    existing one.
  - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements.
- **Compliance review**: Every PR review MUST verify constitutional
  compliance. Periodic audits MUST sample merged work to confirm reviewers
  are applying these gates in practice.
- **Runtime guidance**: Day-to-day development context (commands, stack,
  project layout) lives in `CLAUDE.md` and the active plan under `specs/`;
  this constitution governs principles, not procedures.

**Version**: 1.1.0 | **Ratified**: 2026-05-28 | **Last Amended**: 2026-07-15
