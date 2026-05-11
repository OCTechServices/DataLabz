# RAID Log: data-labz
# Tier 1 — Enterprise Grade | OCTech Services
# Last Updated: 2026-05-08 (Session 1)

---

## Risks
| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R01 | Secrets or credentials accidentally committed to git | Low | Critical | .gitignore covers .env files; inspect-projects.sh scans on each governance cycle |
| R02 | Scope creep — features added beyond CLAUDE.md definition | Medium | High | Review CLAUDE.md at every session start; question any task not traceable to Section 1 |
| R03 | External API dependency breaks or changes without notice | Medium | Medium | Pin dependency versions; document all integrations in CLAUDE.md Section 2 |
| R04 | CLAUDE.md becomes stale — Claude operates from outdated context | Medium | High | Update CLAUDE.md at session end whenever anything meaningful changes |

## Assumptions
| ID | Assumption |
|---|---|
| A01 | Stack and integrations documented in CLAUDE.md Section 2 are accurate |
| A02 | Environment variables follow the naming convention in .env.example |
| A03 | One CLAUDE.md per project — located at project root |

## Issues
| ID | Issue | Source | Priority | Status |
|---|---|---|---|---|
| I01 | RLS policies require explicit GRANT in addition to policies — learned in Session 1 | Supabase | Low | Resolved |
| I02 | create-next-app scaffold overwrites CLAUDE.md — must exclude in rsync | Scaffold | Low | Resolved — rule added to CLAUDE.md |
| I03 | PostgreSQL UPDATE rejects new row if it fails SELECT policy — closing a room triggered this | RLS | Low | Resolved — migration 008 |

## Dependencies
| ID | Dependency | Type | Notes |
|---|---|---|---|
| D01 | Next.js 16.2.6 | Framework | App Router, proxy.ts replaces middleware.ts |
| D02 | Supabase (cloud) | BaaS | Auth, DB, Realtime — project: hi.data.labz |
| D03 | @supabase/ssr | Library | Server-side Supabase client for Next.js |
| D04 | Tailwind CSS 4 | Styling | PostCSS-based, no tailwind.config needed |

## Decisions
| ID | Decision | Options considered | Status | Notes |
|---|---|---|---|---|
| DEC01 | Direct messaging (DMs) | (A) No DMs — room chat only; (B) Room-scoped chat, disappears on close; (C) Async thread tied to session history; (D) Full DMs with social graph | Pending | DMs introduce moderation surface and social graph complexity inconsistent with the task-first model. Room chat (B or C) is more coherent. Revisit when active user base justifies it. |
| DEC02 | Messaging infrastructure — mesh vs. Supabase Realtime | (A) Supabase Realtime — extend existing stack, room-scoped, ~50 lines; (B) WebRTC mesh — P2P signaling via venue-hosted node, café partner covers infra cost | Decided: A for now | Mesh (B) has a coherent business case: café partners (e.g. Better Buzz) host a local node covering their own infra costs, enabling venue-local low-latency chat. Revisit when 10+ active venue partnerships are established. Supabase Realtime is the right call until then. |
