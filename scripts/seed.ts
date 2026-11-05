// Seed script - creates admin, IES College, departments, badges, weeks, questions, mock tests
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";
import { WEEKS, QUESTIONS, MOCK_TESTS, BADGES } from "../src/lib/seed-data";

async function main() {
  console.log("Seeding database...");

  // 1. Create Colleges - IES College of Engineering
  const iesCollege = await db.college.upsert({
    where: { code: "IES" },
    update: {},
    create: {
      name: "IES College of Engineering",
      code: "IES",
      location: "Chittilsalai, Thrissur, Kerala",
    },
  });
  console.log("College created:", iesCollege.name);

  // 2. Create Departments for IES
  const departments = ["EEE", "ME", "R&AI", "CE", "DS", "CSE", "ECE"];
  for (const deptName of departments) {
    await db.department.upsert({
      where: { code_collegeId: { code: deptName, collegeId: iesCollege.id } },
      update: {},
      create: {
        name: deptName === "EEE" ? "Electrical & Electronics Engineering"
          : deptName === "ME" ? "Mechanical Engineering"
          : deptName === "R&AI" ? "Robotics & Artificial Intelligence"
          : deptName === "CE" ? "Civil Engineering"
          : deptName === "DS" ? "Data Science"
          : deptName === "CSE" ? "Computer Science & Engineering"
          : "Electronics & Communication Engineering",
        code: deptName,
        collegeId: iesCollege.id,
      },
    });
  }
  console.log("Departments created for", iesCollege.name);

  // 3. Create Admin user
  const adminPassword = await bcrypt.hash("nptelmoocadmin", 10);
  const admin = await db.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      name: "Administrator",
      role: "ADMIN",
    },
  });
  console.log("Admin created:", admin.username);

  // 4. Create Weeks
  for (const w of WEEKS) {
    await db.week.upsert({
      where: { number: w.number },
      update: { title: w.title, description: w.description },
      create: { number: w.number, title: w.title, description: w.description },
    });
  }
  console.log("Weeks created:", WEEKS.length);

  // 5. Create Topics & Questions
  const topicMap = new Map<string, string>();
  let qCount = 0;
  for (const q of QUESTIONS) {
    const week = await db.week.findUnique({ where: { number: q.weekNumber } });
    if (!week) continue;
    const topicKey = `${q.weekNumber}|${q.topicName}|${q.part}`;
    let topicId = topicMap.get(topicKey);
    if (!topicId) {
      const topic = await db.topic.create({
        data: {
          weekId: week.id,
          name: q.topicName,
          part: q.part,
        },
      });
      topicId = topic.id;
      topicMap.set(topicKey, topicId);
    }
    await db.question.create({
      data: {
        weekId: week.id,
        topicId,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        explanation: q.explanation,
        whyWrongA: q.whyWrongA,
        whyWrongB: q.whyWrongB,
        whyWrongC: q.whyWrongC,
        whyWrongD: q.whyWrongD,
        difficulty: q.difficulty,
        part: q.part,
      },
    });
    qCount++;
  }
  console.log("Questions created:", qCount);

  // 6. Create Mock Tests
  for (const mt of MOCK_TESTS) {
    let questionIds: string[] = [];
    if (mt.weekNumber === null) {
      const allQs = await db.question.findMany({
        orderBy: { createdAt: "asc" },
      });
      const byWeek = new Map<number, typeof allQs>();
      for (const q of allQs) {
        const w = await db.week.findUnique({ where: { id: q.weekId } });
        if (!w) continue;
        if (!byWeek.has(w.number)) byWeek.set(w.number, []);
        byWeek.get(w.number)!.push(q);
      }
      const perWeek = Math.max(1, Math.floor(mt.numQuestions / byWeek.size));
      for (const [, qs] of byWeek) {
        questionIds.push(...qs.slice(0, perWeek).map(q => q.id));
      }
      const used = new Set(questionIds);
      for (const q of allQs) {
        if (questionIds.length >= mt.numQuestions) break;
        if (!used.has(q.id)) {
          questionIds.push(q.id);
          used.add(q.id);
        }
      }
    } else {
      const week = await db.week.findUnique({ where: { number: mt.weekNumber } });
      if (week) {
        const qs = await db.question.findMany({
          where: { weekId: week.id },
          orderBy: { createdAt: "asc" },
          take: mt.numQuestions,
        });
        questionIds = qs.map(q => q.id);
      }
    }
    await db.mockTest.create({
      data: {
        title: mt.title,
        description: mt.description,
        weekId: mt.weekNumber ? (await db.week.findUnique({ where: { number: mt.weekNumber } }))?.id : null,
        durationMin: mt.durationMin,
        questionIds: JSON.stringify(questionIds),
      },
    });
  }
  console.log("Mock tests created:", MOCK_TESTS.length);

  // 7. Create Badges
  for (const b of BADGES) {
    await db.badge.upsert({
      where: { name: b.name },
      update: { description: b.description, icon: b.icon, criteria: b.criteria },
      create: {
        name: b.name,
        description: b.description,
        icon: b.icon,
        criteria: b.criteria,
      },
    });
  }
  console.log("Badges created:", BADGES.length);

  console.log("Seeding complete!");
  console.log("Admin login: username='admin', password='nptelmoocadmin'");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
