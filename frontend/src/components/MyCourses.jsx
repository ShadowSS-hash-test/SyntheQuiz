import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, FileText, Download, Eye, BookOpen, CheckCircle2, X, Loader2 } from 'lucide-react';
import useCourseStore from '../stores/useCourseStore'; 
import useUserStore from '../stores/useUserStore'; 
import useQuizStore from '../stores/useQuizStore'; // Added Quiz Store import

const MyCourses = () => {
  // ─── UI NAVIGATION STATE ──────────────────────────────────────────────────
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // ─── MODAL & FORM STATE ───────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── LOADING STATES FOR QUIZZES ───────────────────────────────────────────
  const [isFetchingQuizzes, setIsFetchingQuizzes] = useState(false);
  const [isFetchingQuizDetails, setIsFetchingQuizDetails] = useState(false);

  // ─── GLOBAL STORES ────────────────────────────────────────────────────────
  const { courses, fetchCourses, createCourse, loading: coursesLoading } = useCourseStore();
  const { user } = useUserStore();
  const { getQuizzesByCourse, getQuizById } = useQuizStore(); // Pulling API methods

  // ─── LOCAL DATA STATE ─────────────────────────────────────────────────────
  const [quizzes, setQuizzes] = useState([]);
  const [quizDetails, setQuizDetails] = useState(null);

  // Fetch actual courses immediately when this component mounts
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // ─── HANDLERS ─────────────────────────────────────────────────────────────

  const handleCreateCourse = async (e) => {
    e.preventDefault(); 
    
    if (!newCourseName.trim()) return; 

    setIsSubmitting(true);

    const newCourse = await createCourse({
      course_name: newCourseName,
      course_coordinator: user.user_id 
    });

    if (newCourse) {
      setIsCreateModalOpen(false);
      setNewCourseName('');
    }
    
    setIsSubmitting(false);
  };

  // Fetch the summary list of quizzes for the selected course
  const handleCourseClick = async (course) => {
    setSelectedCourse(course);
    setIsFetchingQuizzes(true);
    
    const fetchedQuizzes = await getQuizzesByCourse(course.course_id);
    setQuizzes(fetchedQuizzes || []);
    
    setIsFetchingQuizzes(false);
  };

  // Fetch the full details (including questions) for the selected quiz
  const handleQuizClick = async (quiz) => {
    setIsFetchingQuizDetails(true);
    
    const fullQuiz = await getQuizById(quiz.quiz_id);
    if (fullQuiz) {
      setQuizDetails(fullQuiz);
      setSelectedQuiz(fullQuiz);
    }
    
    setIsFetchingQuizDetails(false);
  };

  // ─── VIEW 3: QUIZ DETAILS ─────────────────────────────────────────────────
  if (selectedQuiz && quizDetails) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in-up pb-20">
        <button
          onClick={() => {
            setSelectedQuiz(null);
            setQuizDetails(null);
          }}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft size={16} /> Back to {selectedCourse.course_name}
        </button>

        {/* Header Section */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Generated {new Date(quizDetails.created_at).toLocaleDateString()}
            </span>
            <h1 className="text-3xl font-bold text-white mt-1 capitalize">{quizDetails.topic}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-md border border-gray-700 capitalize">
                {quizDetails.difficulty} Difficulty
              </span>
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-md border border-gray-700 capitalize">
                {quizDetails.quiz_type === 'rag' ? 'Document Grounded' : 'Topic Generated'}
              </span>
            </div>
          </div>
          <button className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center gap-2">
            <Download size={16} /> Export PDF
          </button>
        </div>

        {/* Render Questions List */}
        <div className="space-y-4">
          {quizDetails.questions.map((q, idx) => (
            <div key={q.question_id} className="bg-gray-800/40 backdrop-blur-md border border-gray-600/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-gray-500">Q{idx + 1}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-gray-700/40 border-gray-600/40 text-gray-300">
                  {q.question_type === 'mcq' ? 'Multiple Choice' : 'True / False'}
                </span>
              </div>
              
              <p className="text-white font-semibold mb-4">{q.question}</p>
              
              <div className={`grid gap-2 ${q.question_type === 'true_false' ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
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

              {/* Optional: Render explanation if it exists */}
              {q.explanation && (
                <div className="mt-4 p-3 bg-blue-900/10 border border-blue-500/20 rounded-xl text-sm text-blue-200">
                  <span className="font-bold block mb-1">Explanation:</span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── VIEW 2: COURSE DETAILS (QUIZ LIST) ───────────────────────────────────
  if (selectedCourse) {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in-up">
        <button
          onClick={() => {
            setSelectedCourse(null);
            setQuizzes([]);
          }}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft size={16} /> Back to My Courses
        </button>

        {/* Course Header */}
        <div className="mb-10 bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-3xl p-8 shadow-xl">
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">
            {selectedCourse.course_id.split('-')[0]} 
          </span>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mt-3">
            {selectedCourse.course_name}
          </h1>
        </div>

        {/* Quizzes List Container */}
        <div className="bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-8 py-5 border-b border-gray-700/60 bg-gray-800/60 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText size={20} className="text-blue-400" />
              Generated Quizzes
            </h2>
            <span className="text-xs text-gray-400">{quizzes.length} Total Sets</span>
          </div>

          <div className="divide-y divide-gray-700/50">
            {isFetchingQuizzes ? (
              <div className="px-8 py-12 text-center flex flex-col items-center gap-3 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                Loading quizzes...
              </div>
            ) : quizzes.length > 0 ? (
              quizzes.map((quiz) => (
                <div key={quiz.quiz_id} className="px-8 py-6 hover:bg-gray-800/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-white text-base capitalize">{quiz.topic}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                      <span>Generated: {new Date(quiz.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="capitalize">{quiz.difficulty}</span>
                      <span>•</span>
                      <span className="capitalize">{quiz.quiz_type === 'rag' ? 'Document-Based' : 'General Topic'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={() => handleQuizClick(quiz)}
                      disabled={isFetchingQuizDetails}
                      className="px-4 py-2 text-xs font-semibold rounded-full bg-gray-800/80 border border-gray-600/50 text-gray-300 hover:bg-gray-700 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isFetchingQuizDetails && selectedQuiz?.quiz_id === quiz.quiz_id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Eye size={14} />
                      )}
                      Preview
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

  // ─── VIEW 1: COURSE LIST (MAIN VIEW) ──────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up relative">
      
      {/* ── CREATE COURSE MODAL OVERLAY ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-fade-in-up">
            
            <button 
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewCourseName(''); 
              }}
              className="absolute top-6 right-6 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-white mb-2">Create New Course</h2>
            <p className="text-sm text-gray-400 mb-6">Give your course a name to start generating tailored quizzes.</p>

            <form onSubmit={handleCreateCourse} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Course Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Intro to Computer Science"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !newCourseName.trim()}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Course'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">
            Overview
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white">My Courses</h1>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-6 py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus size={18} /> New Course
        </button>
      </div>

      {/* Display States */}
      {coursesLoading && courses.length === 0 ? (
        <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          Loading courses...
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-3xl bg-gray-800/20">
          <p className="text-gray-400 mb-4">You haven't created any courses yet.</p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
          >
            + Create your first course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.course_id}
              onClick={() => handleCourseClick(course)}
              className="rounded-3xl p-6 border border-gray-500/30 bg-gray-800/40 backdrop-blur-md hover:border-blue-500/50 hover:bg-gray-800/60 transition-all duration-300 shadow-xl cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-full">
                    {course.course_id.split('-')[0]}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-gray-800/80 border border-gray-600/50 text-blue-400 flex items-center justify-center">
                    <BookOpen size={16} />
                  </div>
                </div>
                <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors mb-2">
                  {course.course_name}
                </h3>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-700/50 flex justify-between items-center text-xs text-gray-400">
                <span>View Course</span>
                <span className="text-blue-400 group-hover:translate-x-1 transition-transform">
                  &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;