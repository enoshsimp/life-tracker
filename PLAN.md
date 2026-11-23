# Life Tracker — Build Plan

A personal **Life OS** for one person: vision → goals → habits → daily action → measurement → reflection. It makes each day clear, rewards progress straight away, and stays flexible, with no hourly timetables.

We build it in **small stages**. Each stage ends with something you can open and test, followed by a commit (a saved snapshot), so it's always possible to go back.

---

## 1. What the app is

- **Mobile-first:** designed for a phone screen first and works on a laptop too.
- **Dark mode**, bold numbers, clean cards and satisfying feedback (animation plus a small phone vibration) whenever you make progress.
- **Game mechanics everywhere:** points, levels, life-area stats, streaks, badges and a reward shop.
- **Fast:** logging a day takes under 2 minutes. Anything heavier happens weekly or monthly.
- **Installable:** add it to your phone's home screen and it opens like a normal app, even offline.
- **Private:** all data lives on your device. No accounts, no backend, no APIs.
- **Free hosting** on GitHub Pages.

### Screens

Bottom tabs (never more than 5). Each tab appears when its stage is built.

| Tab | What it shows |
|---|---|
| **Today** | Habits grouped by Morning / Work / Evening / Anytime, wake and bed times, top priorities, points, streak and level |
| **Health** | Measurements and charts, gym sessions this week, Skills & Lifts with personal bests |
| **Goals** | Vision per life area, goals with milestones and progress bars, "Plan your year" |
| **Money** | Monthly snapshot, spending quick-add and the monthly summary |
| **More** | Inbox, Reviews, Reward shop, Reading, Stats and Settings |

A floating **+** button on every screen opens **quick capture**.

---

## 2. The privacy rule

The code is in a **public** GitHub repository, so **no personal values go in the code, PLAN.md, README or commit messages**. That covers habits, targets, point values you choose, rewards, goals, vision, measurements, money amounts, categories, books and work stream names.

- A **first-run setup screen** asks for the essentials the first time the app opens.
- Everything can be changed later in **Settings**.
- The code only contains neutral placeholders and starting values (for example "Habit 1", or the default life area names).

---

## 3. Tech choices

| Tool | What it does, in plain English |
|---|---|
| **Vite** | Runs the app on your computer while we build it and packages it for the web |
| **React** | Builds the screens out of reusable pieces |
| **TypeScript** | JavaScript with labels on the data, which catches mistakes before you see them |
| **Tailwind CSS** | Styles the app (colours, spacing, dark mode) right inside the code |
| **localStorage** | The browser's built-in storage, so your data stays on your device |
| **vite-plugin-pwa** | Makes the app installable and usable offline (Stage 5) |

We keep the extras minimal: charts are drawn by hand (no chart library), and tabs are simple app state (no routing library).

**Nothing gets installed without asking first.**

---

## 4. Rules for every stage

1. Keep everything that works, and keep the current look (dark theme, fonts, colours, card style, bottom tabs).
2. Extend the existing data model and never duplicate data. Anything that can be worked out from saved data (streaks, levels, totals) is calculated, not stored twice.
3. Every data change bumps the data version and adds a migration, so existing data upgrades without loss.
4. All storage reads and writes stay in one module (`src/lib/storage.ts`), so we can switch to IndexedDB later.
5. No personal values in the code, PLAN.md, README or commit messages.
6. Logging a day takes under 2 minutes.
7. Mobile-first, with 5 bottom tabs or fewer. Extra screens go in **More** or in sub-tabs.
8. Ask before installing any package, and explain things in plain English.
9. At the end of each stage: run the app, go through the test checklist, wait for an OK, then commit.

---

## 5. How the data is stored

All data is saved under **one key** in localStorage, with a **version number** so updates can upgrade old data safely. Each stage that changes the data adds one upgrade step.

| Part | Holds | Added in |
|---|---|---|
| **settings** | Habits, life areas, work streams, sleep targets, day reset, week start, point values, rewards, review questions, spending categories | Stages 1–9 |
| **days** | One record per app-day: what was ticked (full or min), wake and bed times, top priorities | Stage 1 |
| **inbox** | Quick captures with an optional tag (idea, task, reminder, explore) | Stage 3 |
| **ledger** | Every point earned or spent (ticks, bonuses, personal bests, milestones, reviews, purchases) | Stage 4 |
| **achievements** | Badges unlocked and when | Stage 4 |
| **meta** | Date of the last backup | Stage 5 |
| **measurements** | Metrics (name, unit) and dated values, shared by Health, Goals and Money | Stage 6 |
| **vision, goals** | Vision text per life area and horizon, and goals with milestones and linked habits | Stage 7 |
| **reviews** | Weekly and monthly review answers | Stage 8 |
| **spending** | Spending entries (amount, category, note) | Stage 9 |
| **books** | Books and their reading status | Stage 10 |

Streaks, shields, levels, life-area XP and balances are **calculated** from these, not stored separately.

---

## 6. The stages

### Stage 1 — Project setup + Today screen ✅ Done
Create the project, add Tailwind and the dark theme, and build the Today screen using placeholder habits.

- Date header that respects the 4am reset
- Checklist with full/min ticks, wake and bed buttons that log the time, a top priority per work stream
- Tick animation and vibration
- Ticks are saved in localStorage

**What you can test:**
- [x] `npm run dev` opens the app in your laptop browser
- [x] The app also opens on your phone over your home Wi-Fi
- [x] Ticking a habit shows the animation, and the tick is still there after refreshing the page
- [x] Tapping "Woke up" records the current time
- [x] Between midnight and 4am, the app still shows the previous day

### Stage 2 — Settings + first-run setup ✅ Done
A step-by-step setup wizard on first open, plus a Settings screen for every personal value.

**What you can test:**
- [x] A fresh browser (or private window) shows the setup wizard
- [x] After setup, Today shows your own habits, gym days and work streams
- [x] Changing a habit in Settings updates Today immediately
- [x] Searching the code finds none of your personal values

### Stage 3 — Habit upgrade + quick capture
- **Life areas:** 8 areas you can rename in Settings (defaults: Health, Mind, Career, Business, Wealth, Relationships, Lifestyle, Self). Every habit belongs to one area.
- **Time of day:** every habit belongs to a group (Morning, Work, Evening, Anytime). Today shows habits under these headings, with no clock times. "Woke up" sits under Morning, "Going to bed" under Evening, and the work-stream priorities under Work.
- **Frequency:** every day, specific days, or X times per week. Weekly-target habits show progress like "Gym 2/4 this week" and can be ticked on any day.
- The Habits step of the setup wizard and the Settings screen are updated to match.
- **Upgrade:** existing habits get area Self, time Anytime, and their current schedule (every day, or their specific days).
- **Quick capture:** a floating + button on every screen opens a one-line input with an optional tag (idea, task, reminder, explore), saved to an **Inbox** list.
- **More tab:** holds Inbox and Settings. The bottom bar becomes Today · More for now.

**What you can test:**
- [ ] Your existing habits and ticks are still there after the upgrade
- [ ] Renaming a life area in Settings shows the new name everywhere
- [ ] Today groups habits under Morning, Work, Evening and Anytime
- [ ] A "specific days" habit only shows on those days
- [ ] A "3 times per week" habit shows 0/3, then 1/3 after a tick, and resets on the first day of the week
- [ ] The + button works on every screen, and captures appear in the Inbox with their tag
- [ ] You can tick off or delete Inbox items

### Stage 4 — Game layer
- **Points:** full and minimum ticks earn points (each habit's values are editable), plus a bonus for hitting a weekly target.
- **Levels:** an overall level, plus an XP level for each life area, like character stats.
- **Streaks:** a day keeps the streak when every habit scheduled that day is done at least at minimum. Weekly-target habits are judged at the end of the week: missing a target counts as a missed day.
- **Streak shield:** one per week, used automatically on the first miss. Unused shields don't carry over.
- **Random bonus:** a small chance (editable) that a tick earns double points, with a special animation.
- **Achievements:** badges such as a first 7-day streak or 30 full days, with an animation when one unlocks.
- **Ledger:** every point earned or spent is recorded, so the balance can always be traced.
- All point values are editable in Settings.

**What you can test:**
- [ ] Full earns more points than minimum, and unticking takes the points back
- [ ] Hitting a weekly target adds the bonus once
- [ ] Each life area's XP rises with its own habits
- [ ] Completing every scheduled habit adds 1 to the streak
- [ ] Missing one day uses the shield; missing a second that week resets the streak
- [ ] Reaching a new level, or unlocking a badge, plays its animation
- [ ] Raising the bonus chance in Settings makes double points appear
- [ ] The ledger lists every earn

### Stage 5 — Go live
- **Installable (PWA)** on the phone and works offline. Needs `vite-plugin-pwa` (I'll ask first).
- **Backup:** export and import a backup file, plus a reminder on Today if you haven't backed up in 7 days. Importing an older backup upgrades it.
- **GitHub:** create the public repository (we'll choose between the GitHub website and the GitHub CLI; I'll ask before installing anything) and publish to GitHub Pages with a GitHub Actions workflow that rebuilds on every upload.
- Commits use your private GitHub no-reply email.
- **Updates never wipe saved data:** the data lives in the browser, separate from the app files, and old data is always upgraded, never replaced.

**What you can test:**
- [ ] The live link opens on your phone and installs to the home screen
- [ ] The installed app opens in airplane mode
- [ ] Export downloads a backup file; erasing the data and importing it brings everything back
- [ ] The backup reminder appears when the last backup is over 7 days old
- [ ] After a new version is published, your data is still there
- [ ] The public repository and its history contain no personal data

### Stage 6 — Health tab
- **Measurements log:** dated numbers for any metric (weight, waist, body fat, plus your own), quick to add. Health, Goals and Money all use it.
- **Charts** for each metric.
- **Gym this week** against target, from the gym habit.
- **Skills & Lifts** (e.g. pull-ups, L-sit hold), kept as metrics with "higher is better" or "lower is better", showing your best result over time. A new personal best earns points and a celebration.

**What you can test:**
- [ ] You can create your own metric and log values for it
- [ ] Logging a metric on 3 dates draws a chart
- [ ] "Gym this week" matches your gym ticks
- [ ] Beating your best on a skill plays the celebration and adds points to the ledger

### Stage 7 — Vision + Goals
- **Vision:** a short text per life area for 1, 3, 5 and 10 years.
- **Goals:** a life area, a horizon (year, quarter, month or week) and a measurable target. Progress comes from a number you update, a Measurements metric, or how consistently you do the linked habits.
- **Milestones**, linked habits and progress bars. Points for milestones and finished goals.
- **"Plan your year":** a separate guided flow (not part of the setup wizard) that walks through vision, then yearly goals, then habits.

**What you can test:**
- [ ] Vision text saves for each life area and horizon
- [ ] A goal linked to a metric updates when you log that metric
- [ ] A goal linked to habits shows your consistency
- [ ] Ticking a milestone or finishing a goal adds points
- [ ] "Plan your year" can be run any time from Goals

### Stage 8 — Reviews + reward shop
- **Weekly review** (Sunday, on the last day of your week): stats filled in automatically (consistency, points, goal progress, neglected life areas), 3 to 5 reflection questions (editable), and sorting the Inbox.
- **Monthly review** on the 1st.
- Points for completing a review.
- **Reward shop:** create rewards with point costs. Rewards you can't afford are shown but can't be bought. Purchases go in the ledger.

**What you can test:**
- [ ] The weekly review appears on Sunday with stats already filled in, and your answers are saved
- [ ] The monthly review appears on the 1st
- [ ] You can sort Inbox items during the review
- [ ] You can add, edit and delete rewards
- [ ] Buying a reward lowers your balance and appears in the ledger
- [ ] You can't buy a reward you can't afford

### Stage 9 — Money
- **Monthly snapshot:** investments, cash reserves, monthly income and net worth, saved into the Measurements log so goals can track them.
- **Spending quick-add:** amount, category and an optional note in under 10 seconds (also from the + button). Categories are editable.
- A monthly summary by category.
- Points for a logging streak.
- All amounts, categories and targets are entered by you in the app.

**What you can test:**
- [ ] A monthly snapshot appears in the Measurements log and can power a goal
- [ ] Adding a spend takes under 10 seconds, from the Money tab or the + button
- [ ] The monthly summary totals each category correctly
- [ ] Logging on consecutive days builds the logging streak and earns points

### Stage 10 — Reading + learning
- A **books list:** want to read, reading, done.
- **Reading time** comes from a reading habit you choose.
- **Ideas** are quick captures tagged to a book or topic.

**What you can test:**
- [ ] You can add a book and move it between want to read, reading and done
- [ ] Ticking your reading habit shows on the book you're reading
- [ ] A quick capture can be tagged to a book and shows up under it

### Stage 11 — Analytics
- Consistency per habit, balance across life areas, trends over time, and goal progress over time.

**What you can test:**
- [ ] Each habit shows its consistency for the last 4 weeks and 3 months
- [ ] The life-area balance shows which areas are getting attention and which are neglected
- [ ] Trends and goal progress match your logged data

### Later (not in this plan)
- Built-in AI. For now, the backup file can be uploaded to a Claude chat.
- Automated tests for the trickiest logic (day boundary, streaks, shields, points).

---

## 7. How we test

- Each stage has a checklist. We go through it together before moving on.
- After any data upgrade, we check that existing data is still there.
