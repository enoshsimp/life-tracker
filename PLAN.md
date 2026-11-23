# Life Tracker — Build Plan

A personal life tracker web app for one person. It makes each day clear and rewards progress straight away.

We build it in **7 small stages**. Each stage ends with something you can open and test, followed by a commit (a saved snapshot), so it's always possible to go back.

---

## 1. What the app is

- **Mobile-first:** designed for a phone screen first and works on a laptop too.
- **Dark mode**, bold numbers, clean layout and satisfying feedback (animation plus a small phone vibration) when you tick something off.
- **Installable:** add it to your phone's home screen and it opens like a normal app, even offline.
- **Private:** all data lives in your browser's storage (localStorage) on your device. No accounts, no backend, no APIs.
- **Free hosting** on GitHub Pages.

### Screens (tabs along the bottom)

| Tab | What it shows |
|---|---|
| **Today** | Today's checklist, points earned today, streak, level progress |
| **Body** | Weekly weight and body-fat log, trend chart, gym sessions this week vs target |
| **Work** | One weekly objective and one key metric per work stream, plus the Sunday review |
| **Shop** | Your rewards and points balance; spend points here |
| **Settings** | Every personal value, plus backup export/import |

---

## 2. The privacy rule

The code will go in a **public** GitHub repository, so **no personal values go in the code**. That covers habits, targets, point values, rewards, gym days, work stream names, body goals and units.

- A **first-run setup screen** asks for all of them the first time the app opens.
- Everything can be changed later in **Settings**.
- The code only contains neutral placeholder text such as "Habit 1" or "Work stream A".

---

## 3. Tech choices

| Tool | What it does, in plain English |
|---|---|
| **Vite** | Runs the app on your computer while we build it and packages it for the web |
| **React** | Builds the screens out of reusable pieces |
| **TypeScript** | JavaScript with labels on the data, which catches mistakes before you see them |
| **Tailwind CSS** | Styles the app (colours, spacing, dark mode) right inside the code |
| **localStorage** | The browser's built-in storage, so your data stays on your device |
| **vite-plugin-pwa** | Makes the app installable and usable offline (Stage 6) |

We keep the extras minimal: the body chart is drawn by hand (no chart library), and the tabs are simple app state (no routing library).

**Nothing gets installed without asking first.** Node.js and npm (the tools that run and download the code) are already on your computer.

---

## 4. The rules of the game

These are the starting defaults. Anything marked ⚙️ can be changed in Settings.

**The day**
- The day resets at **4am**, not midnight. Anything you tick before 4am counts for the day before. ⚙️
- The week runs **Monday to Sunday**. ⚙️

**Habits**
- Every habit has a **full version** and a **minimum version**, each with its own point value. ⚙️
- **Wake time and bedtime:** tapping the button records the current time. If it's inside your target window you get full points; if it's later you get minimum points. ⚙️
- **Gym** only appears on your gym days. ⚙️
- **Diet check-ins** are simple yes/no ticks. ⚙️
- **Top priority per work stream:** you type today's one priority and tick it when done.

**Streaks**
- A day **keeps the streak alive** when every habit scheduled that day is done at least at its minimum.
- **Streak shield:** you get one per week. It's used automatically on the first missed day of that week, so the streak survives. Unused shields don't carry over.

**Points and levels**
- Every tick earns points (minimum earns fewer than full).
- **Random bonus:** there's a small chance (default 10%) that a tick earns double points, with a special animation. ⚙️
- **Levels:** each level needs a few more points than the last. Your level and a progress bar sit at the top of Today.
- **Points ledger:** every point earned or spent is recorded, so your balance can always be traced.

**Reward shop**
- You create your own rewards and set their price in points. Buying one deducts the points.

---

## 5. How the data is stored

All data is saved under **one key** in localStorage, with a **version number** so future updates can upgrade old data safely.

- **settings:** habits (full/min and points), gym days, wake/bed targets, body goals and units, work stream names, rewards, bonus chance
- **days:** one record per app-day covering what was ticked (full or min), logged times, priorities, points earned and whether the shield was used
- **body:** weekly weight and body-fat entries
- **work:** per week and per work stream, the objective, the key metric (target and actual) and the review notes
- **ledger:** every points earn and spend
- **purchases:** rewards you've bought

---

## 6. The stages

### Stage 1 — Project setup + Today screen
Create the project, add Tailwind and the dark theme, and build the Today screen using placeholder habits.

- Date header that respects the 4am reset
- Checklist with full/min ticks, wake and bed buttons that log the time, a top priority per work stream
- Tick animation and vibration
- Ticks are saved in localStorage

**What you can test:**
- [ ] `npm run dev` opens the app in your laptop browser
- [ ] The app also opens on your phone over your home Wi-Fi
- [ ] Ticking a habit shows the animation, and the tick is still there after refreshing the page
- [ ] Tapping "Woke up" records the current time
- [ ] Between midnight and 4am, the app still shows the previous day

### Stage 2 — Settings + first-run setup
A step-by-step setup wizard on first open, plus a Settings screen for every personal value.

**What you can test:**
- [ ] A fresh browser (or private window) shows the setup wizard
- [ ] After setup, Today shows your own habits, gym days and work streams
- [ ] Changing a habit in Settings updates Today immediately
- [ ] Searching the code finds none of your personal values

### Stage 3 — Points, streaks, levels, shields
Add the game layer.

**What you can test:**
- [ ] Ticking full earns more points than ticking minimum
- [ ] Completing every habit (at least minimum) adds 1 to the streak
- [ ] Missing one day uses the shield, so the streak survives
- [ ] Missing a second day that week resets the streak
- [ ] Reaching a new level plays the level-up animation
- [ ] The random bonus triggers occasionally (raise the chance in Settings to check)

### Stage 4 — Body + Work tabs
Weekly body log, trend chart, gym count; weekly objectives and metrics.

**What you can test:**
- [ ] Logging weight and body fat for 3 weeks draws a trend chart
- [ ] "Gym this week" matches your gym ticks and shows progress against your target
- [ ] Each work stream shows its objective and key metric for the week
- [ ] They stay through the week and start fresh on Monday

### Stage 5 — Reward shop + weekly review
Create rewards, spend points, and add the Sunday review.

**What you can test:**
- [ ] You can add, edit and delete rewards
- [ ] Buying a reward lowers your balance and appears in the ledger
- [ ] Rewards you can't afford yet are shown but can't be bought
- [ ] On Sunday, the weekly review appears, and your answers are saved

### Stage 6 — Phone install (PWA) + backup
Make the app installable and usable offline, and add export/import.

**What you can test:**
- [ ] "Add to Home Screen" on your phone gives an app icon
- [ ] The installed app opens in airplane mode
- [ ] Export downloads a backup file
- [ ] Clearing the app's data and then importing the file brings everything back

### Stage 7 — Upload to GitHub + publish on GitHub Pages
Create a public GitHub repository, upload the code and set up automatic publishing.

- We'll choose then between the GitHub website and the GitHub CLI (not installed yet; I'll ask before installing anything)
- A GitHub Actions workflow (an automatic script on GitHub) rebuilds and republishes the site on every upload
- Commits use your private GitHub no-reply email, so your real email stays hidden

**What you can test:**
- [ ] The live link opens on your phone
- [ ] The app installs from the live link
- [ ] The public repository and its history contain no personal data

---

## 7. How we test

- Each stage has the checklist above. We go through it together before moving on.
- Later, optionally: small automated tests for the trickiest logic (the 4am day boundary, streaks, shields and points), where mistakes are hardest to spot by hand.
