# 🐞 Bug Hunter Workflow

A reusable GitHub Actions workflow that scans pull requests and commits to detect **high-severity bugs** before they reach production.

It focuses only on **critical correctness issues** such as:
- data loss and corruption
- crashes and runtime failures
- security vulnerabilities (auth bypass, unsafe input handling)
- major user-facing breakage

---

## 🚀 Features

- 🔍 Scans changed files in pull requests
- 🧠 Detects critical bugs using rule-based + optional AI analysis
- ⚡ Fails CI when high-risk issues are found
- ♻️ Reusable across multiple repositories
- 🛡️ Focused on real production risks (not style or minor issues)

---

## 📦 Usage

### 1. Add to your repository

Create this file in your project:
.github/workflows/bug-hunter.yml


### 2. Use the workflow

```yaml
name: Bug Hunter

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  bug-hunter:
    uses: your-username/bug-hunter-workflow/.github/workflows/bug-hunter.yml@main
    with:
      fail_on_critical: true
```
| Name               | Type    | Default | Description                          |
| ------------------ | ------- | ------- | ------------------------------------ |
| `fail_on_critical` | boolean | true    | Fail CI if critical issues are found |
