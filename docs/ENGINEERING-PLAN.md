# Coffee Nomad: engineering plan

Checkpoint before any refactor: `coffee-nomad-checkpoint-v5.html` (the version before this round). Tag it in GitHub as `v0.5-prototype` before Phase 1.
Run the regression suite any time: `npm i jsdom@22 && node tests/smoke.js` (last run: 20 checks, all passed, in a simulated browser, not a real one).

Status key: **Working** · **Needs work** · **Prototype** (looks real, is simulated or local only) · **Config** (needs an outside service) · **Missing**.
Priority: Critical, High, Medium, Low.

## 1. Feature-preservation checklist

| # | Feature | Current behaviour and implementation | Status | Priority | Improve | Preserve by | Test after |
|---|---|---|---|---|---|---|---|
| 1 | Hero and motion | CSS keyframes, SVG coffee scene, cursor glow in JS, reduced-motion respected | Working | Low | Real pour video, lower paint cost | Keep ids `hv`, `heroNear`; keep reduced-motion rule | Smoke test, visual check, Lighthouse |
| 2 | Theme toggle | `data-theme` plus CSS variables, icon button | Working | Low | Remember the choice | Keep the token names | Visual check both themes |
| 3 | Ambience | Header vinyl. Plays `audio/ambience.mp3` if present, else a WebAudio jazz loop | Working, unheard in real browsers | Medium | Categories, volume, licensed tracks | Keep `#amb` toggle and fallback order | Manual listen on iOS and Android |
| 4 | Café discovery | Browser calls the public Overpass API, geolocation, area and radius, nearest first | Needs work | High | Server-side cache and throttling, Kenyan data gaps | Keep the `search()` input and output shape | Recorded-response fixture test |
| 5 | Open now | Parses OSM `opening_hours`, Nairobi time, "Hours not listed" when unknown | Working for common rules | Medium | Fuller parser, stale-data handling | Pure functions stay unchanged | Unit tests on hours strings (done) |
| 6 | Map | Leaflet with public OpenStreetMap tiles | Config | High | Production tile provider | Keep marker colours and click-to-card | Real device check |
| 7 | Café card | Dialog with status, hours, Book and Menu | Working | Medium | Full detail pages | Keep the two-button flow | Smoke test (done) |
| 8 | Booking hand-off | Notice, 4 s countdown, tagged link, click log on the device | Prototype | High | Server redirect with unique ids | Keep notice and cancel | Mock-server test |
| 9 | Menu book | Full-screen page flip, drag, tap, keys. Content is a sample menu | Prototype (content) | Medium | Real menus from verified owners | Keep the flip component | Smoke test (done) |
| 10 | Menu to caffeine log | "Log" adds an estimate to the tracker | Working | Medium | Ranges instead of single numbers | Keep one-tap logging | Smoke test |
| 11 | Brew calculator | Dose, ratio slider, servings, instant water | Working | Medium | Input clamping, save recipes | Keep the 20 g to 334 g V60 result | Unit test (done) |
| 12 | Guided timer | Wall-clock based, cues, chime or your clips, wake lock, skip cue | Working in simulation | Medium | Test backgrounded tabs, voice settings | Keep cue ids and clip names | Real-device background test |
| 13 | Eight brew methods | V60, Chemex, French press, AeroPress, Siphon, Espresso, Moka, Cold brew | Working. Siphon, Chemex, Moka not checked against sources | Medium | Verify recipes | Keep the method data shape | Each method run independently |
| 14 | Technique panel | Equipment, technique, mistakes and cleaning per selected method | Working | Low | Troubleshooting and flavour adjustments | Keep `TX` data | Smoke test (done) |
| 15 | Caffeine model | One-compartment, absorption plus half-life, optional weight | Working in simulation | Medium | Ranges, species, origin, notes | Keep the model and its numbers | Numeric unit test |
| 16 | Charts | Hand-drawn SVG, today curve and 7 days | Working | Low | Time-of-day and method views | Keep chart ids | Visual check |
| 17 | Sleep cutoff | Eight hours before bedtime plus predicted level at bed | Working | Low | Make assumptions visible | Keep wording informational | Visual check |
| 18 | Sign-up and validation | Strict client-side checks, consent record, stored on the device | Prototype. Not real authentication | Critical | Real accounts on a server | Keep the field rules, repeat them on the server | Smoke test, then server tests |
| 19 | Google and Apple | Preview buttons only | Prototype / Config | High | Real OAuth | Keep the buttons and the date-of-birth step | OAuth sandbox test |
| 20 | Guest preview | Link that skips sign-up | Prototype | High | Needs your decision (see section 4) | Leave as is until decided | Smoke test |
| 21 | Consent | Version, time and choices saved on the device | Prototype | High | Save on the server, separate marketing and analytics | Keep the version field | Database test |
| 22 | Dashboard | Overview, activity with delete, referrals, profile, export, delete | Prototype (local data) | High | Server data, saved cafés and recipes | Keep the four tabs | Smoke test, ownership tests |
| 23 | Policies and cookie notice | Template text in dialogs | Needs legal review | High | Review under the Data Protection Act 2019 | Keep the links | Content review |
| 24 | Referral log | Counts on the device only | Prototype | High | Unique ids, click records, confirmed-booking reconciliation | Keep the notice | Attribution test |
| 25 | Content Security Policy | Allows inline scripts and styles | Needs work | High | Move scripts and styles to files, drop `unsafe-inline` | Keep the allowed hosts list | Page still loads under the strict policy |
| 26 | `schema.sql` | Tables, row-level security, nearby and open-now function | Missing (never run on a live database) | High | Run it, then test every policy | Keep table names | Policy tests per role |
| 27 | Responsive layout | Breakpoints at 1024, 860, 420 and 350 px | Needs work (untested on real devices) | Medium | Test on phones and tablets | Keep the bottom navigation | Device checks |

Nothing above is removed. Changes in this round: Ratios section removed (its content now appears per method in the Brew lab), header and vinyl made visible in both themes and on phones, Moka pot, skip-cue, consent versioning and per-entry delete added. A bug was also found and fixed: the Chemex and Siphon buttons were missing from the previous version.

## 2. Roadmap

Work in small steps. Each step ends with the tests passing and a GitHub tag.

**Phase 1: Engineering foundation (highest priority)**
| Step | What | Done when | External need |
|---|---|---|---|
| 1.1 | Split the one file into `index.html`, `styles.css` and script modules, no behaviour change | `tests/smoke.js` still passes | None |
| 1.2 | Create the Supabase project, run `schema.sql`, write policy tests for each role | A user cannot read another user's rows | Supabase account |
| 1.3 | Real email sign-up with verification, sign-in, sign-out, password reset | Verified account works across two devices | Email sender |
| 1.4 | Google and Apple sign-in | Real sign-in replaces the preview | Google and Apple developer setup |
| 1.5 | Guest mode and sign-up prompts (after your decision) | Guests can explore, prompts appear when saving | None |
| 1.6 | Consent and privacy records on the server, export and delete account | Export file and full deletion verified | Legal review |
| 1.7 | Error handling, logging, tighter CSP | No `unsafe-inline` for scripts | Monitoring account |
| 1.8 | Automated test run on every GitHub push | Failing tests block a release | None |

**Phase 2: Core experience (high priority)**
| Step | What |
|---|---|
| 2.1 | Café data through a server function with caching and fallbacks, café detail pages, verified and unverified labels |
| 2.2 | Brewing academy: verify every recipe, saved and editable personal recipes |
| 2.3 | Caffeine journal: ranges, species and origin fields, notes, editing, reminders |
| 2.4 | Dashboard backed by the server: saved cafés, recipes, history, privacy settings |

**Phase 3: Business infrastructure**
| Step | What |
|---|---|
| 3.1 | Café owner accounts and claim-and-verify flow |
| 3.2 | Owner tools: hours, menus, photos |
| 3.3 | Admin area and moderation with server-enforced roles |
| 3.4 | Referral tracking: unique ids, click records, confirmed bookings, merchant reports |

**Phase 4: Production excellence**
Security testing, performance, accessibility (WCAG 2.2 AA), SEO, monitoring, backups, deployment and a recovery plan.

## 3. What each phase needs from outside the code
Supabase project, an email sender, Google and Apple developer accounts, a production map and geocoding provider, a domain, a lawyer's review of the policies, and signed commission agreements with cafés.

## 4. Decisions I need from you before Phase 1
1. **Gate or guests?** Today the site asks everyone to sign up first. Your engineering brief says guests should explore freely and be asked to register when saving things. These conflict. Which do you want?
2. **Framework.** My recommendation: keep plain HTML for now, split it into modules (1.1) and add Supabase. Consider Next.js at Phase 2, when café pages need server rendering for search engines. Cost: a migration and a new hosting setup.
3. **Map provider** (cost and licensing to compare before choosing).
4. **Legal review** for the privacy, cookie and terms text.
5. **Referral model:** which cafés you will approach first and how commission is confirmed.

## Update (version 8)
Done in this round: stronger email checks (disposable list, typo detection, mail-record lookup, honeypot, attempt cooldown); real Google and Apple sign-in code, switched off until you add client IDs (`SETUP.md`); the page split into `index.html`, `styles.css` and `app.js` with no inline scripts or style elements (Phase 1.1 done, CSP tightened); installable app files (`manifest.webmanifest`, `sw.js`); search by café name, saved cafés, recently viewed, saved recipes, loading placeholders and a retry button. Rows 18, 19 and 25 above are therefore partly improved but still need the server (real accounts, token verification) before they count as complete. Regression suite: 55 checks, all passing in a simulated browser.

## Update (version 10)
Your logo and app icon are now the site brand (header, footer, tab icon, home-screen icon). The real pour video is the homepage default and the drawing is only a fallback if the video fails. Regression suite extended to cover icon sizes, manifest files and the video fallback.
