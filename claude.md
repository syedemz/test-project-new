# test-project-new

## Project metadata

- **Name:** test-project-new
- **Description:** This is a new project, A front end application to be developed in react native and expo
- **Scope / vision:** To evaluate the capabilities and fine tune end to end software development lifecycle using agentic ai
- **Desired output:** a well structured, functional and well tested app deployed on an android emulator device on android studio
- **Intended audience:** single person audience that is the user

## Technology stack

- **Frontend:** React Native + Expo
- **Backend:** NONE, No Backend
- **Hosting:** NONE, No Hosting
- **Deployment:** Expo , Android Studio, Android Virtual Device
- **IaC:** NONE

## Workspace rules

- `C:\Users\syede\Claude-Master\engineeringprinciples.md` — global engineering principles + non-negotiable rules (no parallelism, phase-completion handoff)
- `C:\Users\syede\Claude-Master\gitbranching.md` — git branching strategy (skeleton, filled out later)
- `C:\Users\syede\Claude-Master\contextmanagement.md` — protocol for context updates and `/clear` after each feature

## Workspace lessons applied

- **Branch naming belongs to the subagent, not the dispatcher.** When `/implement-phase <n>` dispatches a story, the main agent's brief MUST NOT specify a branch name. The subagent reads `gitbranching.md` at dispatch and derives the name from its rules (one branch per phase: `feat/phase-<n>-<short>`). Reference the rule by name in the brief; never dictate. Reason: in this project's first phase 1 dispatch (2026-05-01), the dispatcher dictated a per-story branch name (`feat/phase-1-1.1-verify-prereqs`), the subagent obeyed the explicit instruction over the rule, and the per-phase-branch convention was violated. Recorded in `C:\Users\syede\Claude-Master\lessons.md`.

## Workflow

Workflow triggers are slash commands. Never act on phrases.

- `/create-plan` — light cross-phase brainstorm on `architecture.md`, then generate the thin `implementationplan.md` index plus one detailed PRD per phase under `implementationplan/`
- `/implement-phase <n>` — per-phase brainstorm against the active PRD (persisted to `phasebrainstorms/`), then implement phase `n` if its `ready` flag is true in the index and prior phases are done

## Session loading

When a new session starts in this folder, the main agent reads (in this order):

1. Workspace `CLAUDE.md` (auto-loaded)
2. This file (`claude.md`)
3. `context.md`
4. `implementationplan.md` (thin index only)

It does NOT load `architecture.md`, `codingprinciples.md`, `cicd.md`, any per-phase PRD under `implementationplan/`, or any brainstorm file under `phasebrainstorms/` at session start. Those are read on demand.
