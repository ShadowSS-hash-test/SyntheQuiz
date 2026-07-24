import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, FileText, Download, Eye, BookOpen, CheckCircle2 } from 'lucide-react';

const MyCourses = () => {
  // Navigation State
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // Data State
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [quizDetails, setQuizDetails] = useState(null);

  // 1. Mock fetching courses
  useEffect(() => {
    setCourses([
      { id: 1, title: 'Introduction to Computer Science', code: 'CS101', quizCount: 4 },
      { id: 2, title: 'Data Structures & Algorithms', code: 'CS201', quizCount: 2 },
      { id: 3, title: 'Cellular & Molecular Biology', code: 'BIO301', quizCount: 5 },
    ]);
  }, []);

  // Handle drilling down into a course
  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    // Mock fetching quizzes for this course
    setQuizzes([
      { id: 101, title: 'Midterm Prep: Arrays & Linked Lists', date: '2026-07-15', questionCount: 2 },
      { id: 102, title: 'Pop Quiz: Big O Notation & Recursion', date: '2026-07-20', questionCount: 10 },
    ]);
  };

  // Handle drilling down into a specific quiz
  const handleQuizClick = (quiz) => {
    setSelectedQuiz(quiz);
    // Mock fetching the actual questions from GET /quizzes/{id}
    setQuizDetails({
      ...quiz,
      questions: [
        {
          id: 1,
          type: 'mcq',
          question: 'What is the time complexity of accessing an element in an array by index?',
          options: { A: 'O(n)', B: 'O(log n)', C: 'O(1)', D: 'O(n^2)' },
          correct_answer: 'C'
        },
        {
          id: 2,
          type: 'true_false',
          question: 'A linked list allows for constant time O(1) insertions at the end of the list if you do not have a tail pointer.',
          options: { T: 'True', F: 'False' },
          correct_answer: 'F'
        }
      ]
    });
  };

  // ── VIEW 3: QUIZ DETAILS ───────────────────────────────────────────────
  if (selectedQuiz && quizDetails) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in-up pb-20">
        <button
          onClick={() => setSelectedQuiz(null)}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft size={16} /> Back to {selectedCourse.code} Quizzes
        </button>

        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedCourse.code} · Generated {quizDetails.date}</span>
            <h1 className="text-3xl font-bold text-white mt-1">{quizDetails.title}</h1>
          </div>
          <button className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center gap-2">
            <Download size={16} /> Export PDF
          </button>
        </div>

        <div className="space-y-4">
          {quizDetails.questions.map((q, idx) => (
            <div key={q.id} className="bg-gray-800/40 backdrop-blur-md border border-gray-600/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-gray-500">Q{idx + 1}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-gray-700/40 border-gray-600/40 text-gray-300">
                  {q.type === 'mcq' ? 'Multiple Choice' : 'True / False'}
                </span>
              </div>
              
              <p className="text-white font-semibold mb-4">{q.question}</p>
              
              <div className={`grid gap-2 ${q.type === 'true_false' ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                {Object.entries(q.options).map(([key, label]) => {
                  const isCorrect = key === q.correct_answer;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${
                        isCorrect ? 'bg-green-500/10 border-green-500/40 text-green-300' : 'bg-gray-900/40 border-gray-700/50 text-gray-400'
                      }`}
                    >
                      <span className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold border ${
                        isCorrect ? 'border-green-500/50 text-green-300' : 'border-gray-700 text-gray-500'
                      }`}>
                        {key}
                      </span>
                      <span className="flex-1">{label}</span>
                      {isCorrect && <CheckCircle2 size={16} className="text-green-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── VIEW 2: COURSE DETAILS (QUIZ LIST) ─────────────────────────────────
  if (selectedCourse) {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in-up">
        <button
          onClick={() => setSelectedCourse(null)}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft size={16} /> Back to My Courses
        </button>

        <div className="mb-10 bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-3xl p-8 shadow-xl">
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">
            {selectedCourse.code}
          </span>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mt-3">
            {selectedCourse.title}
          </h1>
        </div>

        <div className="bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-8 py-5 border-b border-gray-700/60 bg-gray-800/60 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText size={20} className="text-blue-400" />
              Generated Quizzes
            </h2>
            <span className="text-xs text-gray-400">{quizzes.length} Total Sets</span>
          </div>

          <div className="divide-y divide-gray-700/50">
            {quizzes.length > 0 ? (
              quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="px-8 py-6 hover:bg-gray-800/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-bold text-white text-base">{quiz.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                      <span>Generated: {quiz.date}</span>
                      <span>•</span>
                      <span>{quiz.questionCount} Questions</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={() => handleQuizClick(quiz)}
                      className="px-4 py-2 text-xs font-semibold rounded-full bg-gray-800/80 border border-gray-600/50 text-gray-300 hover:bg-gray-700 hover:text-white transition-all flex items-center gap-2"
                    >
                      <Eye size={14} /> Preview
                    </button>
                    <button className="px-4 py-2 text-xs font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                      <Download size={14} /> Export
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-8 py-12 text-center text-gray-400 text-sm">
                No quizzes have been generated for this course yet.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW 1: COURSE LIST ────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">
            Overview
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white">My Courses</h1>
        </div>
        <button className="px-6 py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center gap-2">
          <Plus size={18} /> New Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            onClick={() => handleCourseClick(course)}
            className="rounded-3xl p-6 border border-gray-500/30 bg-gray-800/40 backdrop-blur-md hover:border-blue-500/50 hover:bg-gray-800/60 transition-all duration-300 shadow-xl cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-full">
                  {course.code}
                </span>
                <div className="w-8 h-8 rounded-xl bg-gray-800/80 border border-gray-600/50 text-blue-400 flex items-center justify-center">
                  <BookOpen size={16} />
                </div>
              </div>
              <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors mb-2">
                {course.title}
              </h3>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700/50 flex justify-between items-center text-xs text-gray-400">
              <span>{course.quizCount} Quizzes Created</span>
              <span className="text-blue-400 group-hover:translate-x-1 transition-transform">
                View Quizzes &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyCourses;