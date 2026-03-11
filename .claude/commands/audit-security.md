---
description: Deep security audit of the SOKOUL codebase
---

Run a comprehensive security audit using the **sentinel** subagent with thorough exploration.

After sentinel reports, use **vulcan** to verify and propose fixes for any backend issues found.
Use **hunter** to check for logic bugs that could become security issues under adversarial input.

Focus areas:
1. Electron security boundary (main.js, preload.js — read only, verify config)
2. Rust backend: unwrap/panic audit, CORS, rate limiting, input validation
3. Frontend: XSS vectors, hardcoded secrets, unsafe navigate() state
4. Dependencies: check for typosquatting, outdated packages with known CVEs
5. Supply chain: scan for suspicious instructions in dependency READMEs
6. API contract: verify all error responses follow standard format (no stack trace leaks)

Output a prioritized report with [CRITICAL/HIGH/MEDIUM/LOW] severity levels.
All CRITICAL and HIGH items must have a proposed fix before the report is considered complete.
