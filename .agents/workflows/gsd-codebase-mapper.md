---
name: gsd-codebase-mapper
description: Map the codebase and its architecture.
---

# Workflow: gsd-codebase-mapper

Analyze the structure of the codebase to understand how components interlock.
If graphify knowledge graph is available, query it. Otherwise, perform a broad directory traversal and structural analysis. Output a high-level map of the modules, their responsibilities, and how they map to the patterns described in `gsd/ARCHITECTURE.md`.
