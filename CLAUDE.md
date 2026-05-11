@AGENTS.md
# data-labz
# Tier 1 — Enterprise Grade | OCTech Services

## 1. Project Purpose
DATA.LABZ is a presence-first, task-anchored digital co-working platform for remote builders.
Users declare a task (the task IS the room), lock in at a physical or digital location, and work
visibly alongside others. Think MySpace (visibility control) + Sims (presence) + Beehive (live task board).

**Operator:** Dan (OCTech Services) — also uses it as his personal co-working space
**Audience:** Remote builders, developers, freelancers, coworkers, friends
**Monetization:** Free tier + café partnerships + premium features (roadmap)
**Tier:** 1 — Enterprise Grade
**Status:** Active — Phase 6 next

## 2. Architecture Overview
**Stack:** Next.js 16 (web), Supabase (DB + Auth + Realtime), Vercel (hosting)
**Key Components:**
- The Hive — live dashboard of all open rooms, categorized by stack/goal
- Rooms — task = room name; creator-only, invite or location-gated access
- Milestones — session goals required to go active; checklist with progress bar on card
- Presence — visibility toggle (online/away/offline), location status
- Venues — café check-in via QR code → location session token (8hr TTL) — Phase 5
- EOD Auto-close — cron job closes all rooms at creator's end of day — post Phase 5

**Data Model:**
- User: id, display_name, avatar_url, visibility
- Venue: id, name, code, qr_token, lat, lng — Phase 5
- CheckIn: user_id, venue_id, token, expires_at — Phase 5
- Room: id, name, creator_id, venue_id, stack_tags[], milestones (JSONB), status, closes_at
- RoomMember: room_id, user_id, role, joined_at

**External Integrations:**
- Supabase Realtime (live presence + room updates)
- Google Maps / Mapbox (venue proximity, map view) — Phase 5
- Wiingy (SSO or embedded widget) — roadmap
- YouTube — roadmap
- Mobile (Expo/React Native) — post-MVP

## 3. Working Rules
- Small, reviewable changes only
- Never modify production data directly
- Check existing patterns before creating new ones
- Ask before adding new dependencies
- Keep this CLAUDE.md under 200 lines — only include what Claude couldn't know on its own
- Never edit more than 3 files at once without presenting a plan first
- If a task requires more than 5 steps, write a plan and get approval before starting
- Delegate mechanical tasks to gpt-4o-mini via `bash scripts/delegate.sh` to conserve Claude tokens
- When scaffolding into an existing project via rsync, always exclude: CLAUDE.md, RAID.md, README.md, .git

**Token delegation — delegate to gpt-4o-mini:**
- Summarizing files, logs, or large text blocks
- Reformatting or renaming content
- Generating boilerplate (config files, basic structure)
- Listing, diffing, or describing content

**Keep with Claude:**
- Architecture and design decisions
- Debugging complex issues
- Security review and anything touching CLAUDE.md or RAID.md

## 4. Commands
```bash
npm run dev        # start dev server (Next.js)
npm run build      # production build
npm run lint       # ESLint
npx supabase start # local Supabase (requires Supabase CLI)
npx supabase db push # apply migrations
```

## 5. Code Standards
- No hardcoded secrets or API keys
- Explicit error handling always
- Follow existing naming conventions

## 6. Security / Data Handling

### Credentials & Secrets
- All credentials via environment variables — never hardcoded, never committed
- `.env` files must be in `.gitignore` before first commit
- Never commit service account files, `.secret.local`, or key files

### Trust Boundaries
- Auth logic lives on the server — never implement authentication or signing logic client-side
- The backend must independently verify every request — never trust client-supplied roles
- Privilege levels must be enforced server-side; client UI state is not a security control

### Database & Access Controls
- RLS enabled on every table holding user data
- Grants explicitly given to authenticated role — not assumed
- Review and resolve all security warnings before shipping

### API & Middleware
- Every API route must have explicit auth unless deliberately public
- Validate and sanitize all external inputs at the boundary
- Never log sensitive user data (PII, tokens, passwords)

## 7. Definition of Done
- [ ] Works as intended
- [ ] No lint errors
- [ ] No secrets exposed
- [ ] Security checklist passed (see Section 6)
- [ ] Change is small and reviewable
- [ ] Existing patterns respected

## 8. Tooling Guidance
- Playwright: [ ] Not approved
- Agents: reviewer, pm-analyst
- Hooks: pre-commit (git), session-end (Claude Code)

## 9. Session Protocol

**Session open:**
```
Read CLAUDE.md, RAID.md, and .claude/prompts/master-prompt.md
before we begin. Confirm your understanding of the project
and state which delivery phase we are in.
```

**Session close:**
```
Read CLAUDE.md, RAID.md, and .claude/prompts/master-prompt.md
and confirm all three are accurate before we sign off.
```

## 10. Deployment Notes (Vercel)

### Deploy Method
**Do NOT use GitHub integration on Vercel Hobby plan.** The commit author check blocks deployments when the git user email differs from the connected GitHub account. Use the Vercel CLI instead:
```bash
npm install -g vercel   # one-time
vercel --prod           # deploy from project root
```
Disconnect any connected GitHub repo in Vercel → Project Settings → Git before deploying via CLI. This is the established pattern across OCTech projects.

### Deployment Checklist
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` in Vercel env vars
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel env vars
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars (server-side only)
- [ ] Set `CRON_SECRET` in Vercel env vars (same value as .env.local)
- [ ] Set `ADMIN_USER_ID` in Vercel env vars (your Supabase user ID)
- [ ] Set `MILESTONE_SECRET` in Vercel env vars (same value as .env.local)
- [ ] Set `ANTHROPIC_API_KEY` in Vercel env vars (for milestone-sync endpoint)
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain in Vercel env vars
- [ ] Add production domain to Supabase → Auth → URL Configuration → Site URL
- [ ] Add production domain to Supabase → Auth → URL Configuration → Redirect URLs
- [ ] Verify Vercel Cron is active post-deploy (Vercel dashboard → Settings → Crons)
- [ ] Supabase → Auth → Email → confirm Magic Link is enabled
- [ ] Run all pending migrations on production DB before going live

## 11. Open Items
- [x] Phase 1: Scaffold — Next.js + Supabase, auth, routing
- [x] Phase 2: Identity — profiles, visibility toggle, presence
- [x] Phase 3: The Hive — live room board, Realtime
- [x] Phase 4: Rooms — create/join/close, milestones, edit name, controls
- [x] Phase 5: Venues — QR check-in, café codes, location-gated rooms
- [x] EOD auto-close — Vercel Cron, runs hourly, service role client, protected by CRON_SECRET
- [x] History + Session versioning — closed rooms list, clone with session increment, incomplete milestones carry forward
- [x] Admin venues UI — /admin/venues, operator-only, add/deactivate/delete venues, live busyness indicator
- [x] Phase 7: Auto-milestone updates — Option B: Claude Code session-end hook → scripts/session-end.sh → /api/rooms/milestone-sync → Claude Haiku semantic match → auto-checks milestones
  - Env vars required: MILESTONE_SECRET, ANTHROPIC_API_KEY, ADMIN_USER_ID
  - Hook configured in .claude/settings.json (Stop event)
- [x] Phase 6: The Virtual Hive — 2D retro pixel world (Phaser.js)
  - Data-lab themed floor: whiteboard wall, espresso bar, glass server closet, collab table, ping pong, Georgia (cat) + Benny (dog)
  - Board/World toggle, dark terminal monitor screens, live metrics panel on back wall
  - Theme support: pixel-dark, pixel-light, glam
- [x] README norm — README.md written as community social contract; read-before-engage norm established; logged in RAID.md
- [ ] Deployment — Vercel (see checklist §10)
- [ ] Decision pending: Messaging (DMs vs room chat vs none) — see RAID.md DEC01
- [ ] Roadmap: Room chat — room-scoped, session-bound (preferred over DMs, revisit with active users)
- [ ] Roadmap: Wiingy integration (lesson completion auto-checks milestone)
- [ ] Roadmap: YouTube integration
- [ ] Roadmap: Mobile (Expo/React Native) — after web is stable
- [ ] Roadmap: Premium features scoping
- [ ] Roadmap: Café partnership outreach (post Phase 5)
