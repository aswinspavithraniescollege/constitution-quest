# Constitution Quest

Gamified NPTEL Learning Platform for the Indian Constitution course.

## Setup

1. Set `DATABASE_URL` environment variable to your PostgreSQL connection string
2. Run `npm run db:push` to create database tables
3. Run `npm run scripts/seed.ts` to seed initial data (admin, colleges, questions, etc.)

## Features

- Gamified learning with XP, levels, badges, and streaks
- 104 MCQs across 8 weeks with detailed explanations
- 9 mock tests (8 weekly + 1 Grand Final)
- Real-time leaderboard, activity feed, discussion forum
- Student notes & bookmarks
- Announcements system
- Live mock test rankings
- Admin, Sub-Admin, Mentor, and Student roles
- Multi-college support
- Email/Password and Google sign-in
- Profile editing for all roles
