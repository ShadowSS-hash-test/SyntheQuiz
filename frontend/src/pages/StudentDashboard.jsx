import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, PlayCircle, CheckCircle, Clock,
  ChevronRight, LogOut, Home, Settings, User,
  Sparkles, Award, FileQuestion,
  BarChart2, Trophy, GraduationCap, XCircle
} from "lucide-react";

// ── Mock data shaped to your actual schema ───────────────────────────────────
const mockCourses = [
  {
    id: "c1",
    course_name: "Data Structures & Algorithms",
    course_coordinator: "Dr. Sharma",
    quizCount: 8,
    completedCount: 5,
    progress: 62,
    color: "bg-blue-500",
    textColor: "text-blue-400",
    glowColor: "shadow-blue-500/30",
  },
  {
    id: "c2",
    course_name: "Operating Systems",
    course_coordinator: "Prof. Mehta",
    quizCount: 6,
    completedCount: 2,
    progress: 33,
    color: "bg-purple-500",
    textColor: "text-purple-400",
    glowColor: "shadow-purple-500/30",
  },
  {
    id: "c3",
    course_name: "Database Management",
    course_coordinator: "Ms. Kapoor",
    quizCount: 10,
    completedCount: 1,
    progress: 10,
    color: "bg-emerald-500",
    textColor: "text-emerald-400",
    glowColor: "shadow-emerald-500/30",
  },
];

const mockQuizHistory = [
  {
    id: "q1",
    course: "Data Structures & Algorithms",
    topic: "Graph Algorithms — BFS & DFS",
    quiz_type: "rag",
    difficulty: "hard",
    score: 88,
    total: 10,
    status: "completed",
    date: "2 days ago",
  },
  {
    id: "q2",
    course: "Operating Systems",
    topic: "CPU Scheduling Algorithms",
    quiz_type: "plain_text",
    difficulty: "medium",
    score: null,
    total: 8,
    status: "pending",
    date: "Due tomorrow",
  },
  {
    id: "q3",
    course: "Data Structures & Algorithms",
    topic: "Dynamic Programming",
    quiz_type: "rag",
    difficulty: "hard",
    score: 70,
    total: 10,
    status: "completed",
    date: "1 week ago",
  },
  {
    id: "q4",
    course: "Database Management",
    topic: "SQL Joins & Indexing",
    quiz_type: "plain_text",
    difficulty: "easy",
    score: 95,
    total: 10,
    status: "completed",
    date: "1 week ago",
  },
];

const difficultyColors = {
  easy:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  hard:   "text-red-400 bg-red-500/10 border-red-500/20",
};

const scoreColor = (score) => {
  if (score >= 85) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
};

// ── Sidebar link ──────────────────────────────────────────────────────────────
function NavLink({ icon, label, active = false, danger = false }) {
  const base = "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer";
  if (active)  return <div className={`${base} bg-blue-600/10 text-blue-400 border border-blue-500/20`}>{icon}{label}</div>;
  if (danger)  return <div className={`${base} text-red-400 hover:text-red-300 hover:bg-red-500/10`}>{icon}{label}</div>;
  return <div className={`${base} text-gray-400 hover:text-gray-100 hover:bg-gray-800/50`}>{icon}{label}</div>;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, iconBg, delay }) {
  return (
    <div
      className="bg-gray-800/40 backdrop-blur-md border border-gray-500/30 p-6 rounded-2xl flex items-center gap-4 animate-fade-in-up"
      style={{ animationDelay: delay }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-black text-white mt-1">{value}</p>
      </div>
    </div>
  );
}

// ── Course card ───────────────────────────────────────────────────────────────
function CourseCard({ course }) {
  return (
    <div className="bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-2xl p-6 hover:bg-gray-800/60 transition-all hover:border-gray-400/40 group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${course.color} bg-opacity-20 flex items-center justify-center`}>
          <BookOpen size={20} className={course.textColor} />
        </div>
        <span className="text-xs font-semibold text-gray-400 bg-gray-900/50 px-2.5 py-1 rounded-md">
          {course.completedCount}/{course.quizCount} Quizzes
        </span>
      </div>

      <h3 className={`text-base font-bold text-white mb-1 group-hover:${course.textColor} transition-colors leading-snug`}>
        {course.course_name}
      </h3>
      <p className="text-sm text-gray-400 mb-5">{course.course_coordinator}</p>

      <div>
        <div className="flex justify-between text-xs font-semibold mb-2">
          <span className="text-gray-400">Progress</span>
          <span className="text-white">{course.progress}%</span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${course.color} transition-all duration-700`}
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>

      <button className={`mt-5 w-full py-2.5 rounded-xl text-xs font-bold border ${course.textColor} border-current hover:bg-current hover:text-gray-900 transition-colors flex items-center justify-center gap-2 group-hover:opacity-100 opacity-60`}>
        Take Next Quiz <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ── Quiz history row ──────────────────────────────────────────────────────────
function QuizRow({ quiz, last }) {
  return (
    <div
      className={`p-5 flex items-center justify-between hover:bg-gray-700/30 transition-colors cursor-pointer rounded-xl ${!last ? "border-b border-gray-700/50" : ""}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider truncate">{quiz.course}</p>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${difficultyColors[quiz.difficulty]}`}>
            {quiz.difficulty}
          </span>
          {quiz.quiz_type === "rag" && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border text-blue-400 bg-blue-500/10 border-blue-500/20">
              RAG
            </span>
          )}
        </div>
        <h4 className="text-sm font-bold text-gray-200 truncate">{quiz.topic}</h4>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1.5">
          {quiz.status === "pending"
            ? <Clock size={11} className="text-amber-400 shrink-0" />
            : <CheckCircle size={11} className="text-emerald-400 shrink-0" />}
          {quiz.date}
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4 shrink-0">
        {quiz.status === "completed" ? (
          <div className="text-right">
            <span className={`font-black text-xl ${scoreColor(quiz.score)}`}>
              {quiz.score}%
            </span>
            <p className="text-xs text-gray-500">{quiz.score >= 85 ? "Great!" : quiz.score >= 60 ? "Good" : "Review"}</p>
          </div>
        ) : (
          <span className="text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-full">
            Pending
          </span>
        )}
        <ChevronRight size={16} className="text-gray-500" />
      </div>
    </div>
  );
}

// ── Score ring (mini) ─────────────────────────────────────────────────────────
function ScoreRing({ score, size = 80 }) {
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171";

  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="transparent" stroke="#374151" strokeWidth="8" />
      <circle
        cx="40" cy="40" r={r}
        fill="transparent"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 40 40)"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text x="40" y="45" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
        {score}%
      </text>
    </svg>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");

  const completedQuizzes = mockQuizHistory.filter(q => q.status === "completed");
  const avgScore = Math.round(
    completedQuizzes.reduce((sum, q) => sum + q.score, 0) / completedQuizzes.length
  );

  return (
    <div className="flex h-screen bg-gray-900 font-sans text-gray-100 overflow-hidden">

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease both;
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-6px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 bg-gray-800/40 backdrop-blur-xl border-r border-gray-700/50 flex-col hidden md:flex z-20">
        <div className="p-6">
          <Link to="/" className="text-xl font-extrabold tracking-widest uppercase text-white hover:opacity-80 transition-opacity">
            Synthe<span className="text-blue-500">Quiz</span>
          </Link>
        </div>

        {/* User pill */}
        <div className="mx-4 mb-6 p-3 rounded-2xl bg-gray-900/40 border border-gray-700/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-black">
            S
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">Snipo</p>
            <p className="text-xs text-gray-400">Student</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          <NavLink icon={<Home size={18}/>}         label="Dashboard"    active={activeNav === "dashboard"} />
          <NavLink icon={<BookOpen size={18}/>}     label="My Courses" />
          <NavLink icon={<FileQuestion size={18}/>} label="Take a Quiz" />
          <NavLink icon={<CheckCircle size={18}/>}  label="Quiz History" />
          <NavLink icon={<BarChart2 size={18}/>}    label="Progress" />
          <NavLink icon={<User size={18}/>}         label="Profile" />
        </nav>

        <div className="p-4 border-t border-gray-700/50 space-y-1">
          <NavLink icon={<Settings size={18}/>} label="Settings" />
          <NavLink icon={<LogOut size={18}/>}   label="Sign Out" danger />
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto relative">

        {/* Decorative orbs */}
        <div className="absolute top-[-5%] left-[10%] w-96 h-96 rounded-full bg-blue-600 opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute top-[50%] right-[-5%] w-80 h-80 rounded-full bg-purple-500 opacity-10 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10 relative z-10">

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 animate-fade-in-up">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
                <Sparkles size={13} /> Student Portal
              </div>
              <h1 className="text-3xl font-bold text-white">Welcome back, Snipo! 👋</h1>
              <p className="text-gray-400 mt-1.5">You have 1 quiz pending. Ready to go?</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 self-start md:self-auto">
              <PlayCircle size={17} /> Take a Quiz
            </button>
          </header>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <StatCard delay="0ms"   icon={<BookOpen size={22} className="text-blue-400"/>}     iconBg="bg-blue-500/20"    label="Enrolled Courses"   value={mockCourses.length} />
            <StatCard delay="100ms" icon={<CheckCircle size={22} className="text-emerald-400"/>} iconBg="bg-emerald-500/20" label="Quizzes Completed"  value={completedQuizzes.length} />
            <StatCard delay="200ms" icon={<Trophy size={22} className="text-amber-400"/>}       iconBg="bg-amber-500/20"   label="Average Score"      value={`${avgScore}%`} />
            <StatCard delay="300ms" icon={<Clock size={22} className="text-red-400"/>}          iconBg="bg-red-500/20"     label="Pending Quizzes"    value={mockQuizHistory.filter(q => q.status === "pending").length} />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Courses — 2 cols */}
            <div className="lg:col-span-2 space-y-5 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">My Courses</h2>
                <a href="#" className="text-sm text-blue-400 hover:text-blue-300 font-semibold transition-colors flex items-center gap-1">
                  View All <ChevronRight size={14}/>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {mockCourses.map(c => <CourseCard key={c.id} course={c} />)}

                {/* CTA card */}
                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:from-blue-600/30 hover:to-purple-600/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/30 flex items-center justify-center">
                    <GraduationCap size={24} className="text-blue-400"/>
                  </div>
                  <p className="text-sm font-bold text-white text-center">Browse & Join New Courses</p>
                  <p className="text-xs text-gray-400 text-center">Explore quizzes from your educators</p>
                  <button className="mt-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
                    Explore <ChevronRight size={13}/>
                  </button>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: "400ms" }}>

              {/* Score ring summary */}
              <div className="bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-2xl p-6 flex flex-col items-center gap-3">
                <h2 className="text-base font-bold text-white self-start">Overall Performance</h2>
                <div className="animate-float">
                  <ScoreRing score={avgScore} size={100}/>
                </div>
                <div className="w-full grid grid-cols-3 gap-2 mt-1">
                  {[
                    { label: "Best",  value: `${Math.max(...completedQuizzes.map(q => q.score))}%`, color: "text-emerald-400" },
                    { label: "Avg",   value: `${avgScore}%`,                                         color: "text-blue-400"   },
                    { label: "Done",  value: completedQuizzes.length,                                color: "text-purple-400" },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-900/40 rounded-xl p-2.5 text-center">
                      <p className={`text-base font-black ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent quiz history */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-white">Recent Quizzes</h2>
                  <a href="#" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">View all</a>
                </div>

                <div className="bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-2xl p-1">
                  {mockQuizHistory.map((q, i) => (
                    <QuizRow key={q.id} quiz={q} last={i === mockQuizHistory.length - 1}/>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}