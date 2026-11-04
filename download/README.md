# Constitution Quest — Gamified NPTEL Learning Platform

A gamified learning platform for the NPTEL course on the Indian Constitution, built for **IES College of Engineering** with multi-college support.

## Admin Login
- **Username**: `admin`
- **Password**: `nptelmoocadmin`

Only the admin can create mentor and student accounts. Mentors and students cannot self-register.

## What's Built

### Three roles, three experiences

1. **Admin** (you)
   - Manage colleges (IES pre-seeded; can add more — each college is data-isolated)
   - Manage departments per college (EEE, ME, R&AI, CE, DS, CSE, ECE pre-seeded for IES)
   - Create mentor accounts (assigned to a college + optional department)
   - Create student accounts (assigned to college, department, and an optional mentor)
   - View platform-wide analytics: total logins, practice attempts, mock tests, top students by XP, college-wise breakdown, recent activity log
   - Toggle student active/inactive, reset passwords, delete students
   - Download CSV exports: All Students, All Mentors, Activity Log (5000 rows), Mock Test Attempts
   - Filter all data by college

2. **Mentor**
   - Sees ONLY students assigned to them
   - Views each student's: XP, level, streak, week-wise practice progress, mock test scores, recent activity log, last login, total logins, badges earned
   - Exports their own students' data as CSV

3. **Student** (gamified)
   - **Practice Arena**: 8 weeks of MCQs (104 questions total) divided into sub-topics. Each question has 4 options, an explanation for the correct answer, AND explanations for why each wrong option is wrong.
   - **Mock Tests**: 9 tests (one per week + 1 Grand Final covering all 8 weeks). Timed tests with detailed score review afterwards.
   - **XP & Levels**: +15 XP per correct practice answer, +50 XP per mock test, +200 bonus for 100% score, +10 XP daily login. Level progression visualized with an animated circular progress ring.
   - **Badges**: 16 unlockable badges (First Steps, Curious Mind, Quiz Warrior, Constitution Master, Sharp Shooter, Mock Test Rookie/Pro, Perfect Score, Week Explorer, All-Rounder, On Fire, Unstoppable, Level 5/10 Hero/Legend, XP Hunter, Grand Champion).
   - **Streaks**: Daily login streaks with fire emoji and longest streak tracking.
   - **Leaderboard**: College-wide and global rankings by XP.
   - **History**: Recent attempts with explanations, full activity log.
   - **Gaming UI**: Dark gradient theme with floating animation, confetti on correct answers and badge unlocks, glowing cards, animated progress bars, pulse effects, custom scrollbar.

### Course Coverage (8 weeks, 104 MCQs)
1. **Week 1** (13 Qs): Basics, Historical Background, Preamble & Features
2. **Week 2** (17 Qs): Sources, Philosophical Underpinnings, Fundamental Rights, DPSP & Citizenship
3. **Week 3** (13 Qs): Parliament, Rajya Sabha, Lok Sabha, Committees & Procedures
4. **Week 4** (12 Qs): President, Vice-President, Prime Minister & Cabinet
5. **Week 5** (12 Qs): State Governance, Governor, Chief Minister, Speaker & Deputy Speaker
6. **Week 6** (12 Qs): Local Governance, Panchayati Raj, 73rd & 74th Amendments, Decentralisation & Municipalities
7. **Week 7** (12 Qs): Judiciary Structure, Supreme Court, High Court & Subordinate Courts
8. **Week 8** (13 Qs): PIL, Judicial Review & Judicial Activism

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide icons, canvas-confetti
- **Backend**: Next.js API Routes (App Router)
- **Database**: Prisma ORM with SQLite
- **Auth**: Cookie-based session with HMAC-signed tokens, bcryptjs password hashing
- **State**: React hooks (no external state library needed)

## File Structure
- `prisma/schema.prisma` — Database schema (Colleges, Departments, Users, Weeks, Topics, Questions, MockTests, Attempts, Badges, ActivityLogs)
- `src/lib/seed-data.ts` — All 104 questions, 9 mock tests, 16 badges, 8 weeks
- `src/lib/auth.ts` — Session management
- `src/lib/gamify.ts` — XP, levels, streaks, badge awarding logic
- `src/app/api/` — All API routes (auth, admin/*, mentor/*, student/*, weeks)
- `src/components/login-screen.tsx` — Gaming-style login
- `src/components/student-app.tsx` — Student gaming platform (home, practice, mock tests, leaderboard, badges, history)
- `src/components/admin-dashboard.tsx` — Admin control panel
- `src/components/mentor-dashboard.tsx` — Mentor view
- `scripts/seed.ts` — Database seeding script

## Next Steps (Future Updates)
The user mentioned future updates will follow. Some ideas for future enhancement:
- Add more questions to the bank (admins can edit questions via UI)
- Bulk student import via CSV
- Email notifications for mentors
- Custom mock test creation by mentors
- Discussion forum per week
- Video integration with NPTEL videos
- Achievement certificates for course completion
