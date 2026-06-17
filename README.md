<div align="center">

# ◆ Lun'Atar

[![Version](https://img.shields.io/npm/v/lunatar?style=flat-square&color=C8A415)](https://www.npmjs.com/package/lunatar)
[![License](https://img.shields.io/badge/license-MIT-333333?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/CrOliX-AltF4/LunAtar/ci.yml?style=flat-square&label=CI)](https://github.com/CrOliX-AltF4/LunAtar/actions)
[![Node](https://img.shields.io/badge/node-%3E%3D20-555555?style=flat-square)](.)

**intent → code**

_A multi-agent AI pipeline CLI. Feed the forge a plain-text intent — refined, tested code comes out._

</div>

---

<div align="center">
  <img src="assets/calcifer-f0.png" alt="Lun'Atar — the forge spirit" width="140"/>
</div>

---

## Quick start

```bash
npm install -g lunatar
lunatar               # the forge opens — setup runs automatically on first launch
```

> [!TIP]
> No API key yet? Type `/demo` in the forge bar — a full pipeline runs on mock data, no credentials needed.

> [!TIP]
> **Easiest entry point:** one [OpenRouter](https://openrouter.ai) key gives you access to 200+ models including free tiers. Lun'Atar will suggest it automatically if no provider is configured.

---

## The forge

One plain-text intent enters. Four agents process it in sequence — each focused on a single role, passing only what the next step needs. On failure, the work goes back into the fire.

```
  "build a REST API to manage users"
           │
           ▼
  ┌──────────────────┐
  │   Product Owner  │  clarifies goal, requirements, constraints
  └────────┬─────────┘
           │  structured requirements
           ▼
  ┌──────────────────┐
  │     Planner      │  architecture, tech stack, task breakdown
  └────────┬─────────┘
           │  architecture + tasks
           ▼
  ┌──────────────────┐
  │    Developer     │  generates complete, runnable files
  └────────┬─────────┘
           │  code files
           ▼
  ┌──────────────────┐
  │   QA Engineer    │  verdict + score + issues
  └────────┬─────────┘
           │  fail? → back to Developer (up to N times)
           ▼
      ✦ artifact sealed
```

Why four agents instead of one? Context pollution. A single LLM handling PO + architecture + code + QA in one context degrades fast. Lun'Atar splits each responsibility, keeps outputs typed, and gives you full traceability per run.

> [!NOTE]
> "Atar" is the Zoroastrian deity of sacred fire — the forge that purifies and transforms. Part of the [Lun' ecosystem](https://github.com/CrOliX-AltF4).

---

## Features

**Pipeline**

- Automatic model selection per role — each agent gets the model best suited for its task
- QA iteration loop — on fail, issues are fed back to Dev for a retry (`--max-iterations`)
- Budget guard — abort if total cost exceeds your limit (`--budget-usd`, `--daily-budget-usd`)
- Provider fallback — automatic failover to the next configured provider

**7 Providers**

| Provider   | Free tier | Notes                                  |
| ---------- | --------- | -------------------------------------- |
| Groq       | ✓         | Ultra-fast LPU — default for PO and QA |
| Gemini     | ✓         | 1M context, strong reasoning           |
| OpenRouter | ✓         | Gateway to 200+ models, one key        |
| Ollama     | ✓         | Local models, no API key               |
| Claude     | —         | Best code quality                      |
| OpenAI     | —         | GPT-4o, o1                             |
| NVIDIA NIM | ✓         | Hosted NVIDIA models                   |

**Skills & Plugins**

_Skills_ are expertise injected into agent prompts — TypeScript conventions, React patterns, Laravel, security rules, REST design, and more. Think of them as the blacksmith's training.

_Plugins_ are tools the agents can wield — write files, read context, web search, run commands, execute code, open GitHub issues. Bridges to the outside world.

Both are declared per-project via `lunatar.config.json` and selectable per-run from the TUI (`/arsenal`).

> [!NOTE]
> Skills and plugins are community-extensible via npm packages (`lunatar-skill-*`, `lunatar-plugin-*`). Install one and Lun'Atar discovers it automatically.

**TUI**

- Animated living flame mascot (Calcifer-inspired) on the idle screen
- Slash command navigation — `/history`, `/arsenal`, `/setup`, `/demo`
- Live pipeline view with forge fire animation per active step
- Tabbed results: Verdict · Artefacts · Stratégie · Diff
- Apply generated files directly to your dungeon (`[a]` key)
- Run history (the Annales) with re-run support
- RPG lexicon — Incantation, Dungeon, Forge, Blacksmith level, Artifact

---

## Setup

The forge is cold until you light it. On first launch, Lun'Atar opens setup automatically.

```bash
lunatar setup                              # interactive provider configuration
lunatar config set groq.apiKey <key>       # or configure directly
lunatar config set openrouter.apiKey <key> # one key, 200+ models
```

> [!TIP]
> Keys are stored in `~/.lunatar/config.json`. Environment variables always take precedence — useful for CI or per-project overrides:
>
> ```bash
> GROQ_API_KEY=<key> lunatar run "..."
> ```

---

## CLI

```bash
lunatar                                         # interactive TUI
lunatar run "build a REST API"                  # fire the forge headlessly
lunatar run "..." --dry                         # preview cost — no LLM calls
lunatar run "..." --apply                       # write output to current directory
lunatar run "..." --skip qa                     # bypass a role
lunatar run "..." --model gemini-2.5-pro        # override model
lunatar run "..." --provider openrouter         # override provider
lunatar run "..." --budget-usd 0.10             # abort above $0.10
lunatar run "..." --max-iterations 3            # allow 3 Dev→QA retries
lunatar run "..." --json                        # machine-readable output
lunatar ask "what does this file do" --file x   # direct question to the LLM
lunatar history                                 # browse the Annales
lunatar costs                                   # combustible spent
lunatar watch ./src --intent intent.txt         # re-forge on file change
lunatar catalog                                 # list available skills and plugins
lunatar init                                    # scaffold a new project
```

## TUI controls

| Key        | Action                                                |
| ---------- | ----------------------------------------------------- |
| `/`        | Slash commands — type to filter autocomplete          |
| `/demo`    | Run demo pipeline (no API key needed)                 |
| `/history` | The Annales — browse past runs                        |
| `/arsenal` | Select skills & plugins for next run                  |
| `/setup`   | Arm the forge — configure API keys                    |
| `↑ ↓`      | Navigate                                              |
| `m`        | Swap rune (change model on focused step)              |
| `↵`        | Fire the forge                                        |
| `1 2 3 4`  | Results tabs — Verdict / Artefacts / Stratégie / Diff |
| `a`        | Deploy to dungeon (apply files to current directory)  |
| `s`        | Seal artifacts (save to `./output/<run-id>/`)         |
| `r / q`    | New forge                                             |

---

## Project config

```json
{
  "skills": {
    "all": ["conventional-commits", "typescript-strict"],
    "dev": ["react-css-modules"]
  },
  "plugins": {
    "dev": ["file_write", "read_file"],
    "qa": ["execute_code"]
  }
}
```

**Skills:** `typescript-strict` · `react-css-modules` · `conventional-commits` · `project-context` · `laravel-conventions` · `test-conventions` · `api-design` · `i18n` · `security`

**Plugins:** `file_write` · `read_file` · `web_search` · `run_command` · `list_directory` · `create_directory` · `execute_code` · `github_create_issue`

---

> [!WARNING]
> Lun'Atar generates code. It does not execute it. The QA agent audits for issues but is not a substitute for human review before deploying to production.

---

## Lun ecosystem

| Project                                                    | Role                                                      |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| **LunAtar**                                                | AI dev pipeline — intent → code                           |
| [LunAcedia](https://github.com/CrOliX-AltF4/LunAcedia)     | Information infrastructure — events · actions · AI butler |
| [LunAvaritia](https://github.com/CrOliX-AltF4/LunAvaritia) | Mobile companion — Android                                |
| [LunImago](https://github.com/CrOliX-AltF4/LunImago)       | Imitation learning — gameplay → ONNX policy               |
| LunAnima                                                   | AI companion core — private                               |

---

<div align="center">

Built by **[CrOliX-AltF4](https://github.com/CrOliX-AltF4)** · MIT License · © 2026

_Where raw intent finds its final form._

</div>
