---
name: Global Development & Documentation Standards
description: Unified guidelines for documentation, file operations, and knowledge management across the entire repository.
applyTo: '**/*'
---

# Copilot Guidelines

### 1. Documentation & Comments
* **Be Ruthlessly Concise:** Prioritize "why" over "what." If the code clearly shows *what* is happening, do not add a comment.
* **Target Audience:** Write for an **intermediate developer**. Assume they understand syntax, but need context on architectural decisions.
* **Self-Documenting Code:** Prefer renaming variables or refactoring functions for clarity over adding descriptive comments.
* **No Redundancy:** If a function is self-explanatory, do not write a comment.

### 2. Docker & Infrastructure
* **Modern Compose Syntax:** Never include the `version` key in `compose.yml` or `docker-compose.yml` files. It is deprecated and triggers unnecessary warnings.
* **Optimization:** Prioritize multi-stage builds and slim/alpine base images unless specific dependencies require a full OS.

### 3. File Operations
* **Strict Scope:** Do not create new documentation files (`.md`, `.txt`) or update `README.md` unless explicitly requested.
* **No Ghost Files:** Only propose file creation if the content is ready to be implemented.

### 4. Knowledge Management
* **Skills Over Docs:** If a piece of information is a "rule" or "pattern" for future prompts, propose it as a **Copilot Skill/Instruction** instead of a code comment.