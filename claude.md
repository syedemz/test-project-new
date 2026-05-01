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

<!-- ## Workspace lessons applied
     (Populate this section only if the user opted in during /start-project. Otherwise omit it.) -->

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
