import React, { useState } from 'react';
import { 
  Search, BookOpen, ChevronRight, Award, 
  Users, PlayCircle, PlusCircle, CheckCircle, BarChart2
} from 'lucide-react';

// ── Mock Data based on your schema ──────────────────────────────────────────
const enrolledCourses = [
  {
    id: "c1",
    name: "Data Structures & Algorithms",
    coordinator: "Dr. Sharma",
    quizzesCompleted: 5,
    quizzesTotal: 8,
    avgScore: 82,
    progress: 62,
    color: "bg-blue-500",
    textColor: "text-blue-400",
    lastActive: "2 days ago",
  },
  {
    id: "c2",
    name: "Operating Systems",
    coordinator: "Prof. Mehta",
    quizzesCompleted: 2,
    quizzesTotal: 6,
    avgScore: 45,
    progress: 33,
    color: "bg-purple-500",
    textColor: "text-purple-400",
    lastActive: "1 week ago",
  },
  {
    id: "c3",
    name: "Database Management",
    coordinator: "Ms. Kapoor",
    quizzesCompleted: 1,
    quizzesTotal: 10,
    avgScore: 95,
    progress: 10,
    color: "bg-emerald-500",
    textColor: "text-emerald-400",
    lastActive: "Just now",
  },
];

const exploreCourses = [
  {
    id: "e1",
    name: "Machine Learning Basics",
    coordinator: "Dr. Alan Turing",
    students: 1205,
    quizzesTotal: 15,
    color: "bg-amber-500",
    textColor: "text-amber-400",
    description: "Introduction to supervised and unsupervised learning models.",
  },
  {
    id: "e2",
    name: "Computer Networks",
    coordinator: "Prof. Vint Cerf",
    students: 840,
    quizzesTotal: 12,
    color: "bg-rose-500",
    textColor: "text-rose-400",
    description: "Learn about the OSI model, TCP/IP, and network security protocols.",
  },
];

export default function MyCoursesSection() {
  const [activeTab, setActiveTab] = useState('enrolled'); // 'enrolled' or 'explore'
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up" style={{ animationDelay: "100ms" }}>
      
      {/* ── HEADER & CONTROLS ──────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Courses 📚</h1>
          <p className="text-gray-400">Track your progress or discover new subjects to master.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800/60 border border-gray-700/50 text-white text-sm rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </header>

      {/* ── TABS ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-gray-700/50 mb-8 pb-px">
        <button 
          onClick={() => setActiveTab('enrolled')}
          className={`pb-4 px-4 text-sm font-bold transition-colors relative ${
            activeTab === 'enrolled' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Enrolled ({enrolledCourses.length})
          {activeTab === 'enrolled' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_-2px_10px_rgba(59,130,246,0.5)] rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('explore')}
          className={`pb-4 px-4 text-sm font-bold transition-colors relative ${
            activeTab === 'explore' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Explore New
          {activeTab === 'explore' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_-2px_10px_rgba(59,130,246,0.5)] rounded-t-full" />
          )}
        </button>
      </div>

      {/* ── COURSE GRID ────────────────────────────────────────────────────── */}
      {activeTab === 'enrolled' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course, idx) => (
            <div 
              key={course.id} 
              className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/60 hover:border-gray-500/50 transition-all flex flex-col animate-fade-in-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${course.color} bg-opacity-20`}>
                  <BookOpen size={24} className={course.textColor} />
                </div>
                <div className="text-right">
                  <span className={`text-xl font-black ${course.avgScore >= 80 ? 'text-emerald-400' : course.avgScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {course.avgScore}%
                  </span>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Avg Score</p>
                </div>
              </div>

              {/* Course Info */}
              <h3 className="text-lg font-bold text-white leading-tight mb-1">{course.name}</h3>
              <p className="text-sm text-gray-400 mb-6 flex items-center gap-1.5">
                Coordinator: <span className="text-gray-300 font-medium">{course.coordinator}</span>
              </p>

              {/* Progress Bar */}
              <div className="mt-auto">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white">{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-900/80 rounded-full h-2 mb-4 overflow-hidden border border-gray-700/50">
                  <div
                    className={`h-full rounded-full ${course.color} transition-all duration-1000 relative`}
                    style={{ width: `${course.progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/40 border border-gray-700/30 mb-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-300 font-semibold">{course.quizzesCompleted} / {course.quizzesTotal} Quizzes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart2 size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-300 font-semibold">{course.lastActive}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className={`py-2.5 rounded-xl text-xs font-bold border border-gray-600 hover:border-gray-400 text-gray-300 transition-colors flex items-center justify-center gap-2`}>
                    View Stats
                  </button>
                  <button className={`py-2.5 rounded-xl text-xs font-bold ${course.color} text-white transition-colors flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-${course.color.replace('bg-', '')}/20`}>
                    <PlayCircle size={14} /> Resume
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exploreCourses.map((course, idx) => (
            <div 
              key={course.id} 
              className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/60 hover:border-gray-500/50 transition-all flex flex-col animate-fade-in-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${course.color} bg-opacity-20`}>
                  <BookOpen size={24} className={course.textColor} />
                </div>
                <div className="bg-gray-900/60 px-3 py-1.5 rounded-lg border border-gray-700/50 flex items-center gap-1.5">
                  <Users size={12} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-300">{course.students}</span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white leading-tight mb-2">{course.name}</h3>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2 leading-relaxed">{course.description}</p>
              
              <div className="mt-auto space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-300 bg-gray-900/40 p-3 rounded-xl border border-gray-700/30">
                  <Award size={16} className={course.textColor} />
                  <span className="font-medium">Taught by {course.coordinator}</span>
                </div>

                <div className="flex items-center justify-between border-t border-gray-700/50 pt-4 mt-2">
                  <span className="text-xs font-bold text-gray-500">{course.quizzesTotal} Quizzes Available</span>
                  <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5">
                    <PlusCircle size={14} /> Enroll Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}