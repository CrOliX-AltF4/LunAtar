<div align="center">

# Lun'Atar

[![Version](https://img.shields.io/npm/v/lunatar?style=flat-square&color=8b0000)](https://www.npmjs.com/package/lunatar)
[![License](https://img.shields.io/badge/license-MIT-333333?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/CrOliX-AltF4/LunAtar/ci.yml?style=flat-square&label=CI)](https://github.com/CrOliX-AltF4/LunAtar/actions)
[![Node](https://img.shields.io/badge/node-%3E%3D20-555555?style=flat-square)](.)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square)](.)

_Feed the forge. Raw intent enters — refined code comes out._

</div>

---

## What is this?

A forge has stages. Each one applies heat in the right way, in the right order, before passing the work forward. **Lun'Atar** does the same for AI-assisted development: a plain-text intent passes through four specialized agents — Product Owner → Planner → Developer → QA — each running on the model best suited for its role, producing structured, typed output at every handoff.

The problem it solves: a single LLM handling PO + architecture + code + QA in one context degrades quickly. Context pollution, no cost control, no traceability. Lun'Atar splits each responsibility into a dedicated agent, passes only the typed slice the next step needs, and keeps a full record of every run.

If QA fails, the work goes back into the fire: Dev receives the issue list and gets another pass, up to a configurable number of iterations.

> [!NOTE]
> "Atar" is the Zoroastrian deity of sacred fire — the forge that purifies and transforms. Part of the [Lun' ecosystem](https://github.com/CrOliX-AltF4).

---

## Quick Start

```bash
npm install -g lunatar
lunatar setup          # configure your first LLM provider
lunatar                # open the interactive TUI
```

Or headless:

```bash
lunatar run "build a REST API to manage users"
```

**Requirements:** Node.js >= 20 · At least one LLM provider API key (Groq has a free tier)

---

## The Pipeline

```
⚡ Intent: "build a REST API to manage users"
           │
           ▼
  ┌─────────────────────┐
  │    Product Owner    │  Clarifies goal, requirements,
  │   (fast, cheap)     │  constraints, complexity
  └──────────┬──────────┘
             │  [structured requirements]
             ▼
  ┌─────────────────────┐
  │       Planner       │  Architecture, tech stack,
  │   (large context)   │  task breakdown, risks
  └──────────┬──────────┘
             │  [architecture + tasks]
             ▼
  ┌─────────────────────┐
  │      Developer      │  Generates complete,
  │    (best at code)   │  runnable files
  └──────────┬──────────┘
             │  [code + entry points]
             ▼
  ┌─────────────────────┐
  │     QA Engineer     │  Audits against requirements,
  │   (fast, precise)   │  verdict + score + issues
  └──────────┬──────────┘
             │  pass? → done
             │  fail? → back to Developer (up to N times)
             ▼
  ╔═════════════════════╗
  ║   Results → disk    ║
  ╚═════════════════════╝
```

---

## Features

**Pipeline & Agents**

- Multi-agent pipeline: PO → Planner → Developer → QA, each role on its own model
- **Iteration loop** — on QA fail, QA issues are fed back to Dev for a retry; configurable via `--max-iterations` (default: 2)
- **Skills system** — inject markdown knowledge into agent prompts from a catalog (TypeScript conventions, React patterns, Laravel, Conventional Commits, etc.)
- **Plugins system** — equip agents with tools: write files, read project context, web search, GitHub issues, sandboxed code execution
- `lunatar.config.json` — declare active skills and plugins per role, per project
- Retry + backoff — JSON parse failures trigger multi-turn retry; rate limits use exponential backoff
- Structured JSON output — agents produce typed JSON, not prose
- Prompt caching — system prompts cached automatically on Claude

**Providers**

- 5 LLM providers: Groq · Gemini · Claude · OpenAI · NVIDIA NIM
- All swappable per step before every run
- `--model` / `--provider` flags to override all agents from the command line

**TUI**

- Interactive pipeline screen with live step status, elapsed timers, and iteration badge on retry
- Per-step model picker (`m` key) — swap model without touching config
- Skills & Plugins toggle screen before each run
- Tabbed results: Overview (verdict + metrics) · Files (inline code preview) · Plan (architecture + tasks)
- Save all generated files to `./output/<run-id>/` with one keypress
- **History screen** — keyboard-driven list/detail view of past runs with re-run support

**CLI**

- Headless mode (`--json`) — progress to stderr, full `PipelineRun` JSON to stdout
- Skip roles (`--skip po,qa`) — bypass any agent for external integration
- Inject PO output (`--from-po`) — supply pre-computed PO JSON from a file or stdin
- Dry run (`--dry`) — preview models, estimated tokens, and cost without any LLM call
- Budget cap (`--budget-usd`) — abort if total cost exceeds the limit
- `lunatar watch <path>` — watch a directory and re-run the pipeline on file changes
- `lunatar init` — scaffold a new project with conventions pre-configured
- `lunatar history` — interactive TUI or `--json` for machine-readable output

> [!WARNING]
> Lun'Atar generates code. It does not execute it. Review everything before running in production. The QA agent audits for issues but is not a substitute for human code review.

---

## Installation

```bash
npm install -g lunatar
```

**From source:**

```bash
git clone https://github.com/CrOliX-AltF4/LunAtar.git
cd LunAtar
npm install && npm run build && npm link
```

---

## Setup

On first launch, `lunatar` detects no provider is configured and opens an interactive setup screen automatically. Or run it explicitly:

```bash
lunatar setup
```

Configure via CLI:

```bash
lunatar config set groq.apiKey    <your-key>
lunatar config set gemini.apiKey  <your-key>
lunatar config set claude.apiKey  <your-key>
lunatar config set openai.apiKey  <your-key>
lunatar config set nim.apiKey     <your-key>
```

Or use environment variables (useful for CI or per-project overrides):

```bash
GROQ_API_KEY=<key> lunatar run "..."
```

> [!TIP]
> Keys are stored in `~/.lunatar/config.json`. Environment variables always take precedence over the stored config.

---

## Usage

```bash
lunatar                                                # interactive TUI (recommended)
lunatar run "create a REST API"                        # skip the prompt screen
lunatar run "create a REST API" --dry                  # preview cost without running
lunatar run "create a REST API" --skip qa              # bypass the QA agent
lunatar run "create a REST API" --json                 # headless: JSON to stdout
lunatar run "intent" --from-po po.json                 # inject pre-computed PO output
lunatar run "intent" --max-iterations 3                # allow up to 3 Dev→QA retries
lunatar run "intent" --model gemini-2.5-pro            # override model for all agents
lunatar run "intent" --provider groq                   # override provider for all agents
lunatar run "intent" --budget-usd 0.10                 # abort if cost exceeds $0.10
lunatar history                                        # browse past runs (interactive TUI)
lunatar history --json --limit 10                      # last 10 runs as JSON
lunatar watch ./src --intent intent.txt                # re-run on file changes
lunatar config list                                    # show configured providers
lunatar init                                           # scaffold a new project (interactive)
lunatar init --name my-api --type cli                  # scaffold without prompts
```

**External PO integration (e.g. Natsume):**

```bash
echo '<po-json>' | lunatar run "intent" --skip po,qa --from-po - --json
```

### TUI Controls

**Pipeline screen:**

| Key   | Action                                |
| ----- | ------------------------------------- |
| `↑ ↓` | Navigate between steps                |
| `m`   | Change the model for the focused step |
| `↵`   | Open Skills & Plugins selector, run   |
| `q`   | Quit                                  |

**Results screen:**

| Key   | Action                                         |
| ----- | ---------------------------------------------- |
| `1`   | Overview — QA verdict, issues, metrics         |
| `2`   | Files — generated files with inline preview    |
| `3`   | Plan — architecture, tech stack, tasks, risks  |
| `↑ ↓` | Navigate files (Files tab)                     |
| `s`   | Save all files + `requirements.md` + `plan.md` |
| `r`   | Start a new pipeline                           |
| `q`   | Quit                                           |

**History screen:**

| Key   | Action                  |
| ----- | ----------------------- |
| `↑ ↓` | Navigate runs           |
| `↵`   | View run detail         |
| `r`   | Re-run with same intent |
| `Esc` | Back to list            |
| `q`   | Quit                    |

---

## Default Models

| Role      | Default              | Rationale                           |
| --------- | -------------------- | ----------------------------------- |
| PO        | Llama 3.3 70B (Groq) | Fast clarification, free tier       |
| Planner   | Gemini 2.5 Flash     | 1M context, strong reasoning, cheap |
| Developer | Claude Sonnet 4.6    | Best code quality                   |
| QA        | Llama 3.3 70B (Groq) | Fast analysis, free tier            |

Every model is swappable via the TUI picker (`m`) before each run, or globally with `--model` / `--provider`.

---

## Project Config (`lunatar.config.json`)

Create `lunatar.config.json` at your project root to activate skills and plugins per role:

```json
{
  "skills": {
    "all": ["conventional-commits"],
    "dev": ["typescript-strict", "react-css-modules"]
  },
  "plugins": {
    "dev": ["file_write", "read_file"],
    "qa": ["execute_code"]
  }
}
```

**Available skills:** `typescript-strict` · `react-css-modules` · `conventional-commits` · `project-context` · `laravel-conventions`

**Available plugins:** `file_write` · `read_file` · `web_search` · `github_create_issue` · `run_command` · `list_directory` · `create_directory` · `execute_code`

> [!NOTE]
> Skills inject markdown knowledge into the agent's system prompt. Plugins give agents tool-use capabilities — `file_write` lets Dev write files directly to `./output/<run-id>/`; `execute_code` lets QA run code in a sandboxed temp directory and verify output.

### `lunatar init` — Project Scaffolding

```bash
lunatar init                          # interactive: asks name + type
lunatar init --name my-app --type cli
```

| Type        | What you get                         |
| ----------- | ------------------------------------ |
| `cli`       | TypeScript CLI with Commander.js     |
| `lib`       | TypeScript library with ESM + Vitest |
| `frontend`  | React + Vite starter                 |
| `fullstack` | Next.js 15 starter with TypeScript   |

All templates include `lunatar.config.json` pre-configured and a CI workflow targeting `master`.

---

## Architecture

```
src/
├── cli/           # Commander.js entry — run, history, setup, config, init, watch
├── ui/            # Ink TUI — Prompt → Config → Pipeline → Results → History
├── orchestrator/  # Public façade — stable entry point for all callers
├── agents/        # Stateless agents: PO · Planner · Dev · QA
├── pipeline/      # Sequential runner + iteration loop + context mappers
├── models/        # Model catalog + recommendation engine
├── providers/     # LLM adapters: Groq · Gemini · Claude · OpenAI · NIM
├── skills/        # Skill registry + markdown catalog
├── plugins/       # Plugin registry + built-in tool implementations
├── config/        # lunatar.config.json loader
└── storage/       # Run persistence (JSON → ~/.lunatar/runs/)
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for workflow, commit conventions, and code standards.

```bash
git clone https://github.com/CrOliX-AltF4/LunAtar.git
cd LunAtar
npm install
npm run dev
```

Branch from `master`, target PRs at `master`. Squash merge only.

---

<div align="center">

Built by **[CrOliX-AltF4](https://github.com/CrOliX-AltF4)**

_Part of the Lun' ecosystem — where raw ideas find their final form._

© 2026 Loric Worms — MIT License

</div>
