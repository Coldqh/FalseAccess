# FALSE ACCESS — Act 0 complete vertical slice

## Structure implemented

### Layer 1 — story mission

`CLINIC-01` now includes:

- process and socket snapshots;
- PID/PPID/user/path correlation;
- sandboxed Python `analyze(path)`;
- visible and hidden datasets;
- hypothesis board;
- evidence links;
- two valid containment families;
- structured evidence report;
- graded hints and critical-error handling.

The old `Terminal → Code → SIEM → Notes` completion route no longer controls Act 0.

### Layer 2 — independent contracts

Three required seeded contracts:

1. filesystem navigation and current-file selection;
2. auth-log source/count analysis;
3. process/network correlation.

Contracts have no hints or inserted commands. Completion depends on command results and linked evidence.

### Layer 3 — transfer operation

`FOUNDATION-CHECK-01` changes:

- client and context;
- source/count/PID/remote;
- event order and noise;
- Python field schema;
- required source selection.

The operation does not disclose the incident class and has no mentor hints.

## Safety

- local synthetic data only;
- no arbitrary external network;
- source evidence is read-only;
- destructive commands are critical errors;
- deterministic seed and reset;
- Pyodide runs only local generated files.

## Verification

- domain TypeScript check: passed;
- integration TypeScript check with repository interface stubs: passed;
- Vitest: 40/40 passed;
- mission definitions validated at runtime;
- visible and hidden dataset generation tested;
- destructive/network boundaries tested.
