# Branch Protection Rules

These rules must be configured manually in **GitHub → Settings → Branches**.

---

## Branch strategy

```
master      ← stable production, protected, releases only
feat/*      ← feature branches, created from master
fix/*       ← bug fix branches, created from master
chore/*     ← maintenance branches, created from master
docs/*      ← documentation branches, created from master
```

PRs always target `master`. There is no integration branch — every feature merges directly. Version bumps in `package.json` trigger an auto-tag, which triggers the release workflow.

---

## `master` — production branch

**Settings → Branches → Add rule → Branch name pattern: `master`**

| Rule                                                   | Value                                                           |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| Require a pull request before merging                  | ✅                                                              |
| Required approvals                                     | 1                                                               |
| Dismiss stale PR approvals when new commits are pushed | ✅                                                              |
| Require review from Code Owners                        | ✅                                                              |
| Require status checks to pass                          | ✅                                                              |
| Required checks                                        | `CI / CI — Node 20`, `Validate PR title (Conventional Commits)` |
| Require branches to be up to date before merging       | ✅                                                              |
| Require conversation resolution before merging         | ✅                                                              |
| Allow squash merging only                              | ✅ (configure in repo Settings → General)                       |
| Allow force pushes                                     | ❌                                                              |
| Allow deletions                                        | ❌                                                              |

---

## Merge strategy (Settings → General)

| Option                             | Value                                 |
| ---------------------------------- | ------------------------------------- |
| Allow merge commits                | ❌                                    |
| Allow squash merging               | ✅ — default commit message: PR title |
| Allow rebase merging               | ❌                                    |
| Automatically delete head branches | ✅                                    |

---

## Release flow

```
feat/my-feature  →  PR  →  master  →  auto-tag.yml detects version bump
                                    →  tag v0.x.x
                                    →  release.yml publishes to npm (OIDC)
```

Version bumps drive releases — bump `package.json` version in the PR that introduces the changes worth releasing.

---

## Labels to create

Go to **Issues → Labels** and create the following:

| Label            | Color     | Description                       |
| ---------------- | --------- | --------------------------------- |
| `bug`            | `#d73a4a` | Something isn't working           |
| `enhancement`    | `#a2eeef` | New feature or request            |
| `dependencies`   | `#0075ca` | Dependency update                 |
| `automated`      | `#e4e669` | Created by a bot                  |
| `github-actions` | `#000000` | GitHub Actions related            |
| `documentation`  | `#0075ca` | Improvements or additions to docs |
| `stale`          | `#ffffff` | No recent activity                |
| `pinned`         | `#e99695` | Exempt from stale bot             |
| `security`       | `#d73a4a` | Security related                  |
| `question`       | `#d876e3` | Further information is requested  |
| `size/XS`        | `#3cbf00` | < 10 lines changed                |
| `size/S`         | `#5d9801` | < 100 lines changed               |
| `size/M`         | `#7f7203` | < 500 lines changed               |
| `size/L`         | `#a14c05` | < 1000 lines changed              |
| `size/XL`        | `#c32607` | > 1000 lines changed              |
| `cli`            | `#bfdadc` | CLI interface                     |
| `ui`             | `#bfdadc` | TUI interface                     |
| `pipeline`       | `#f9d0c4` | Pipeline engine                   |
| `agents`         | `#f9d0c4` | Agent layer                       |
| `models`         | `#c5def5` | Model recommendation engine       |
| `providers`      | `#c5def5` | LLM providers                     |
| `storage`        | `#fef2c0` | Storage layer                     |
| `metrics`        | `#fef2c0` | Metrics and monitoring            |
| `types`          | `#e0d9f7` | Shared TypeScript types           |
| `triage`         | `#ededed` | Needs triage                      |
