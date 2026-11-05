module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const db = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = db;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createSession",
    ()=>createSession,
    "destroySession",
    ()=>destroySession,
    "getCurrentUser",
    ()=>getCurrentUser,
    "hashPassword",
    ()=>hashPassword,
    "verifyPassword",
    ()=>verifyPassword
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
;
;
;
const SESSION_COOKIE = "cq_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "constitution-quest-secret-2026";
// Simple session token: userId.hmac
function signToken(userId) {
    const hmac = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].createHmac("sha256", SESSION_SECRET).update(userId).digest("hex");
    return `${userId}.${hmac}`;
}
function verifyToken(token) {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [userId, hmac] = parts;
    const expected = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].createHmac("sha256", SESSION_SECRET).update(userId).digest("hex");
    // Use timingSafeEqual to prevent timing attacks
    if (hmac.length === expected.length && __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) {
        return userId;
    }
    return null;
}
// Detect if the request is coming over HTTPS.
// Preview/production environments use HTTPS, localhost uses HTTP.
// We check multiple headers to be safe.
async function isHttps() {
    const headerStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["headers"])();
    // Check x-forwarded-proto (set by Caddy, Nginx, etc.)
    const forwardedProto = headerStore.get("x-forwarded-proto");
    if (forwardedProto && forwardedProto.includes("https")) return true;
    // Check if the host is NOT localhost (preview/production = HTTPS)
    const host = headerStore.get("host") || "";
    if (!host.startsWith("localhost") && !host.startsWith("127.0.0.1")) return true;
    return false;
}
async function createSession(userId) {
    const token = signToken(userId);
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    const https = await isHttps();
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: https ? "none" : "lax",
        secure: https,
        path: "/",
        maxAge: 60 * 60 * 24 * 7
    });
}
async function destroySession() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    const https = await isHttps();
    cookieStore.set(SESSION_COOKIE, "", {
        httpOnly: true,
        sameSite: https ? "none" : "lax",
        secure: https,
        path: "/",
        maxAge: 0
    });
}
async function getCurrentUser() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const userId = verifyToken(token);
    if (!userId) return null;
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
        where: {
            id: userId
        },
        include: {
            college: true,
            department: true,
            mentor: true
        }
    });
    if (!user || !user.active) return null;
    return user;
}
async function verifyPassword(plain, hash) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].compare(plain, hash);
}
async function hashPassword(plain) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(plain, 10);
}
}),
"[project]/src/lib/gamify.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "XP_REWARDS",
    ()=>XP_REWARDS,
    "awardXp",
    ()=>awardXp,
    "checkAndAwardBadges",
    ()=>checkAndAwardBadges,
    "levelForXp",
    ()=>levelForXp,
    "logActivity",
    ()=>logActivity,
    "updateStreak",
    ()=>updateStreak,
    "xpForLevel",
    ()=>xpForLevel,
    "xpProgress",
    ()=>xpProgress
]);
// Gamification: XP, levels, streaks, badges
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
function xpForLevel(level) {
    if (level <= 1) return 0;
    return (level - 1) * level * 50;
}
function levelForXp(xp) {
    let level = 1;
    while(xpForLevel(level + 1) <= xp)level++;
    return level;
}
function xpProgress(xp) {
    const level = levelForXp(xp);
    const currentLevelXp = xpForLevel(level);
    const nextLevelXp = xpForLevel(level + 1);
    const intoLevel = xp - currentLevelXp;
    const levelRange = nextLevelXp - currentLevelXp;
    const pct = levelRange > 0 ? Math.round(intoLevel / levelRange * 100) : 100;
    return {
        level,
        currentLevelXp,
        nextLevelXp,
        intoLevel,
        levelRange,
        pct,
        xpToNext: nextLevelXp - xp
    };
}
const XP_REWARDS = {
    CORRECT_ANSWER: 15,
    WRONG_ANSWER: 5,
    MOCK_COMPLETE: 50,
    MOCK_PERFECT: 200,
    DAILY_LOGIN: 10
};
async function updateStreak(userId) {
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
        where: {
            id: userId
        }
    });
    if (!user) return;
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
    if (user.lastActiveDate === todayStr) return; // already updated today
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    let newStreak = 1;
    if (user.lastActiveDate === yesterdayStr) {
        newStreak = user.streak + 1;
    } else if (user.lastActiveDate === todayStr) {
        newStreak = user.streak;
    } else {
        newStreak = 1;
    }
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.update({
        where: {
            id: userId
        },
        data: {
            streak: newStreak,
            longestStreak: Math.max(user.longestStreak, newStreak),
            lastActiveDate: todayStr,
            lastLoginAt: today
        }
    });
    return newStreak;
}
async function awardXp(userId, xp) {
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
        where: {
            id: userId
        }
    });
    if (!user) return;
    const newXp = user.xp + xp;
    const newLevel = levelForXp(newXp);
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.update({
        where: {
            id: userId
        },
        data: {
            xp: newXp,
            level: newLevel
        }
    });
    return {
        newXp,
        newLevel,
        leveledUp: newLevel > user.level
    };
}
async function checkAndAwardBadges(userId) {
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
        where: {
            id: userId
        },
        include: {
            practiceAttempts: {
                include: {
                    question: {
                        select: {
                            weekId: true
                        }
                    }
                }
            },
            mockAttempts: {
                include: {
                    mockTest: {
                        select: {
                            title: true
                        }
                    }
                }
            },
            studentBadges: true
        }
    });
    if (!user) return [];
    const practiceCount = user.practiceAttempts.length;
    const correctCount = user.practiceAttempts.filter((p)=>p.isCorrect).length;
    const mockCount = user.mockAttempts.length;
    const hasPerfectMock = user.mockAttempts.some((m)=>m.score === m.totalQuestions && m.totalQuestions > 0);
    const hasGrandMock = user.mockAttempts.some((m)=>{
        return m.mockTest?.title?.toLowerCase().includes("grand");
    });
    // weeks practiced
    const weekSet = new Set();
    for (const p of user.practiceAttempts){
        if (p.question?.weekId) weekSet.add(p.question.weekId);
    }
    // Calculate longest correct streak (in chronological order)
    const sortedAttempts = [
        ...user.practiceAttempts
    ].sort((a, b)=>a.createdAt.getTime() - b.createdAt.getTime());
    let maxStreak = 0;
    let curStreak = 0;
    for (const a of sortedAttempts){
        if (a.isCorrect) {
            curStreak++;
            maxStreak = Math.max(maxStreak, curStreak);
        } else {
            curStreak = 0;
        }
    }
    const allBadges = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].badge.findMany();
    const earnedBadgeIds = new Set(user.studentBadges.map((sb)=>sb.badgeId));
    const newBadges = [];
    for (const badge of allBadges){
        if (earnedBadgeIds.has(badge.id)) continue;
        let earned = false;
        switch(badge.criteria){
            case "practice_count >= 1":
                earned = practiceCount >= 1;
                break;
            case "practice_count >= 10":
                earned = practiceCount >= 10;
                break;
            case "practice_count >= 25":
                earned = practiceCount >= 25;
                break;
            case "practice_count >= 50":
                earned = practiceCount >= 50;
                break;
            case "streak_correct >= 10":
                earned = maxStreak >= 10;
                break;
            case "mock_count >= 1":
                earned = mockCount >= 1;
                break;
            case "mock_count >= 5":
                earned = mockCount >= 5;
                break;
            case "perfect_score":
                earned = hasPerfectMock;
                break;
            case "weeks_practiced >= 1":
                earned = weekSet.size >= 1;
                break;
            case "weeks_practiced >= 8":
                earned = weekSet.size >= 8;
                break;
            case "streak >= 3":
                earned = user.streak >= 3;
                break;
            case "streak >= 7":
                earned = user.streak >= 7;
                break;
            case "level >= 5":
                earned = user.level >= 5;
                break;
            case "level >= 10":
                earned = user.level >= 10;
                break;
            case "xp >= 1000":
                earned = user.xp >= 1000;
                break;
            case "grand_mock_completed":
                earned = hasGrandMock;
                break;
        }
        if (earned) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].studentBadge.create({
                data: {
                    userId,
                    badgeId: badge.id
                }
            }).catch(()=>{}); // ignore unique constraint
            newBadges.push(badge.id);
        }
    }
    return newBadges;
}
async function logActivity(userId, action, details, durationSec) {
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].activityLog.create({
        data: {
            userId,
            action,
            details,
            durationSec
        }
    });
}
}),
"[project]/src/app/api/auth/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$gamify$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/gamify.ts [app-route] (ecmascript)");
;
;
;
;
async function POST(req) {
    try {
        const { username, password, role } = await req.json();
        if (!username || !password) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Username and password are required"
            }, {
                status: 400
            });
        }
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
            where: {
                username: username.trim()
            },
            include: {
                college: true,
                department: true
            }
        });
        // Always run bcrypt compare to prevent timing attacks (even if user not found)
        const dummyHash = "$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK3a8e5L4pQYqB5e3a8e5L4pQYqB5e";
        const passwordOk = user?.password ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyPassword"])(password, user.password) : await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyPassword"])(password, dummyHash);
        if (!user || !passwordOk) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Invalid username or password"
            }, {
                status: 401
            });
        }
        if (!user.active) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Your account has been deactivated. Please contact your administrator."
            }, {
                status: 403
            });
        }
        // If a role was specified (from role-based login), verify the user has that role
        // For the ADMIN portal, both ADMIN and SUB_ADMIN roles are accepted
        if (role) {
            const roleMatches = user.role === role || role === "ADMIN" && (user.role === "ADMIN" || user.role === "SUB_ADMIN");
            if (!roleMatches) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: `This account is not a ${role.toLowerCase()} account. Please use the correct login portal.`
                }, {
                    status: 403
                });
            }
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createSession"])(user.id);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$gamify$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logActivity"])(user.id, "login", "method=local");
        if (user.role === "STUDENT") {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$gamify$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["updateStreak"])(user.id);
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$gamify$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["awardXp"])(user.id, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$gamify$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["XP_REWARDS"].DAILY_LOGIN);
        }
        // Sync to Firestore (leaderboard + activity) — non-blocking, for all roles
        const updatedUser = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].user.findUnique({
            where: {
                id: user.id
            },
            include: {
                college: true,
                department: true
            }
        });
        if (updatedUser) {
            const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/nptel-constitution-of-india/databases/(default)/documents`;
            // Update leaderboard (for students only — they're the ones with XP)
            if (updatedUser.role === "STUDENT") {
                fetch(`${FIRESTORE_URL}/leaderboard/${updatedUser.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        fields: {
                            userId: {
                                stringValue: updatedUser.id
                            },
                            name: {
                                stringValue: updatedUser.name
                            },
                            username: {
                                stringValue: updatedUser.username || ""
                            },
                            xp: {
                                integerValue: String(updatedUser.xp)
                            },
                            level: {
                                integerValue: String(updatedUser.level)
                            },
                            streak: {
                                integerValue: String(updatedUser.streak)
                            },
                            collegeCode: {
                                stringValue: updatedUser.college?.code || ""
                            },
                            deptCode: {
                                stringValue: updatedUser.department?.code || ""
                            },
                            collegeName: {
                                stringValue: updatedUser.college?.name || ""
                            },
                            updatedAt: {
                                timestampValue: new Date().toISOString()
                            }
                        }
                    })
                }).catch(()=>{});
            }
            // Add to activity feed (all roles)
            fetch(`${FIRESTORE_URL}/activityFeed`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    fields: {
                        userId: {
                            stringValue: updatedUser.id
                        },
                        userName: {
                            stringValue: updatedUser.name
                        },
                        userRole: {
                            stringValue: updatedUser.role
                        },
                        action: {
                            stringValue: "login"
                        },
                        details: {
                            stringValue: "method=local"
                        },
                        collegeCode: {
                            stringValue: updatedUser.college?.code || ""
                        },
                        collegeName: {
                            stringValue: updatedUser.college?.name || ""
                        },
                        timestamp: {
                            timestampValue: new Date().toISOString()
                        }
                    }
                })
            }).catch(()=>{});
        }
        const { password: _, ...safeUser } = user;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            user: safeUser
        });
    } catch (e) {
        console.error("Login error:", e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Login failed due to a server error. Please try again."
        }, {
            status: 500
        });
    }
}
async function DELETE() {
    const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCurrentUser"])();
    if (user) {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$gamify$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logActivity"])(user.id, "logout");
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["destroySession"])();
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: true
    });
}
async function GET() {
    const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCurrentUser"])();
    if (!user) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        user: null
    });
    const { password, ...safeUser } = user;
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        user: safeUser
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__eab03f1f._.js.map