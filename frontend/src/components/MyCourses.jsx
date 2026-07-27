import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, FileText, Download, Eye, BookOpen, 
  CheckCircle2, X, Loader2, Edit3, Trash2, AlertTriangle 
} from 'lucide-react';
import useCourseStore from '../stores/useCourseStore'; 
import useUserStore from '../stores/useUserStore'; 
import useQuizStore from '../stores/useQuizStore'; 

const MyCourses = () => {
  // ─── UI NAVIGATION STATE ──────────────────────────────────────────────────
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // ─── MODAL & FORM STATE ───────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCourseName, setEditCourseName] = useState('');

  // ─── DELETE MODAL STATES ──────────────────────────────────────────────────
  const [isDeleteCourseModalOpen, setIsDeleteCourseModalOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null); 
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── LOADING STATES ───────────────────────────────────────────────────────
  const [isFetchingQuizzes, setIsFetchingQuizzes] = useState(false);
  const [isFetchingQuizDetails, setIsFetchingQuizDetails] = useState(false);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);
  const [exportingQuizId, setExportingQuizId] = useState(null); // Track PDF exports

  // ─── GLOBAL STORES ────────────────────────────────────────────────────────
  const { 
    courses, 
    fetchCourses, 
    createCourse, 
    updateCourse, 
    deleteCourse, 
    loading: coursesLoading 
  } = useCourseStore();
  const { user } = useUserStore();
  const { 
    getQuizzesByCourse, 
    getQuizById, 
    deleteQuiz 
  } = useQuizStore(); 

  // ─── LOCAL DATA STATE ─────────────────────────────────────────────────────
  const [quizzes, setQuizzes] = useState([]);
  const [quizDetails, setQuizDetails] = useState(null);

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

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editCourseName.trim() || !selectedCourse) return;

    setIsSubmitting(true);
    await updateCourse(selectedCourse.course_id, {
      course_name: editCourseName
    });
    
    setSelectedCourse(prev => ({ ...prev, course_name: editCourseName }));
    await fetchCourses();
    
    setIsEditModalOpen(false);
    setIsSubmitting(false);
  };

  const confirmDeleteCourse = async () => {
    setIsDeletingCourse(true);
    await deleteCourse(selectedCourse.course_id);
    await fetchCourses();
    
    setIsDeleteCourseModalOpen(false);
    setSelectedCourse(null);
    setQuizzes([]);
    setIsDeletingCourse(false);
  };

  const handleCourseClick = async (course) => {
    setSelectedCourse(course);
    setIsFetchingQuizzes(true);
    
    const fetchedQuizzes = await getQuizzesByCourse(course.course_id);
    setQuizzes(fetchedQuizzes || []);
    
    setIsFetchingQuizzes(false);
  };

  const handleQuizClick = async (quiz) => {
    setIsFetchingQuizDetails(true);
    
    const fullQuiz = await getQuizById(quiz.quiz_id);
    if (fullQuiz) {
      setQuizDetails(fullQuiz);
      setSelectedQuiz(fullQuiz);
    }
    
    setIsFetchingQuizDetails(false);
  };

  const handleDeleteQuizRequest = (quiz, e) => {
    e.stopPropagation();
    setQuizToDelete(quiz);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    
    setIsDeletingQuiz(true);
    await deleteQuiz(quizToDelete.quiz_id);
    
    setQuizzes(prev => prev.filter(q => q.quiz_id !== quizToDelete.quiz_id));
    setQuizToDelete(null);
    setIsDeletingQuiz(false);
  };

  // ─── EXPORT PDF LOGIC ─────────────────────────────────────────────────────
  const handleExportPDF = async (quizSummary, e) => {
    if (e) e.stopPropagation();
    setExportingQuizId(quizSummary.quiz_id);

    try {
      // If exporting from the summary list, we need to fetch the full question array first
      let fullQuiz = quizSummary;
      if (!fullQuiz.questions) {
        fullQuiz = await getQuizById(quizSummary.quiz_id);
      }

      if (!fullQuiz || !fullQuiz.questions) {
        alert("Failed to load quiz questions for export.");
        return;
      }

      // Generate a styled HTML document for printing
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${fullQuiz.topic} - Quiz</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
            .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { margin: 0 0 10px 0; color: #111; text-transform: capitalize; font-size: 28px; }
            .meta-tags { display: flex; gap: 10px; font-size: 13px; color: #6b7280; }
            .tag { padding: 4px 8px; background: #f3f4f6; border-radius: 4px; border: 1px solid #e5e7eb; text-transform: capitalize; }
            .question-block { margin-bottom: 30px; page-break-inside: avoid; }
            .question-text { font-weight: 600; margin-bottom: 15px; font-size: 16px; color: #1f2937; }
            .options { margin: 0; padding: 0; list-style: none; }
            .option { margin-bottom: 8px; padding: 10px 15px; border: 1px solid #e5e7eb; border-radius: 6px; display: flex; gap: 10px; align-items: flex-start; }
            .option.correct { background-color: #ecfdf5; border-color: #10b981; }
            .option-key { font-weight: bold; color: #4b5563; min-width: 24px; text-transform: uppercase; }
            .option.correct .option-key { color: #059669; }
            .explanation { margin-top: 12px; padding: 12px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 6px 6px 0; font-size: 14px; color: #1e3a8a; }
            .explanation-label { font-weight: bold; margin-bottom: 4px; display: block; }
            @media print {
              body { padding: 0; margin: 20px; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${fullQuiz.topic}</h1>
            <div class="meta-tags">
              <span class="tag">Date: ${new Date(fullQuiz.created_at).toLocaleDateString()}</span>
              <span class="tag">Difficulty: ${fullQuiz.difficulty}</span>
              <span class="tag">Type: ${fullQuiz.quiz_type === 'rag' ? 'Document Grounded' : 'Topic Generated'}</span>
            </div>
          </div>
          
          <div class="questions">
            ${fullQuiz.questions.map((q, idx) => `
              <div class="question-block">
                <div class="question-text">${idx + 1}. ${q.question}</div>
                <ul class="options">
                  ${Object.entries(q.options).map(([key, label]) => `
                    <li class="option ${key === q.correct_answer ? 'correct' : ''}">
                      <span class="option-key">${key})</span>
                      <span>${label}</span>
                    </li>
                  `).join('')}
                </ul>
                ${q.explanation ? `
                  <div class="explanation">
                    <span class="explanation-label">Explanation:</span>
                    ${q.explanation}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </body>
        </html>
      `;

      // Open a hidden window, inject the HTML, and trigger the print dialog
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Delay slightly to ensure styles apply before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);

    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("An error occurred while generating the PDF.");
    } finally {
      setExportingQuizId(null);
    }
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
          <button 
            onClick={() => handleExportPDF(quizDetails)}
            disabled={exportingQuizId === quizDetails.quiz_id}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {exportingQuizId === quizDetails.quiz_id ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} /> 
            )}
            Export PDF
          </button>
        </div>

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
      <div className="max-w-6xl mx-auto animate-fade-in-up relative">
        
        {/* ── EDIT COURSE MODAL OVERLAY ── */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-fade-in-up">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-bold text-white mb-2">Edit Course</h2>
              <p className="text-sm text-gray-400 mb-6">Rename your existing course.</p>

              <form onSubmit={handleUpdateCourse} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Course Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editCourseName}
                    onChange={(e) => setEditCourseName(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !editCourseName.trim() || editCourseName === selectedCourse.course_name}
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── DELETE COURSE MODAL OVERLAY ── */}
        {isDeleteCourseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-red-900/50 rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-fade-in-up">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Delete Course</h2>
                  <p className="text-sm text-gray-400">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-8">
                Are you sure you want to delete <span className="font-bold text-white">{selectedCourse.course_name}</span>? All associated quizzes will be permanently removed.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsDeleteCourseModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold text-sm rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteCourse}
                  disabled={isDeletingCourse}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isDeletingCourse ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} 
                  Delete Course
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DELETE QUIZ MODAL OVERLAY ── */}
        {quizToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-red-900/50 rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-fade-in-up">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Delete Quiz</h2>
                  <p className="text-sm text-gray-400">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-8">
                Are you sure you want to delete the quiz on <span className="font-bold text-white capitalize">{quizToDelete.topic}</span>?
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setQuizToDelete(null)}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold text-sm rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteQuiz}
                  disabled={isDeletingQuiz}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isDeletingQuiz ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} 
                  Delete Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setSelectedCourse(null);
            setQuizzes([]);
          }}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft size={16} /> Back to My Courses
        </button>

        {/* Course Header with Edit/Delete Controls */}
        <div className="mb-10 bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-3xl p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">
              {selectedCourse.course_id.split('-')[0]} 
            </span>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mt-3">
              {selectedCourse.course_name}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => {
                setEditCourseName(selectedCourse.course_name);
                setIsEditModalOpen(true);
              }}
              className="px-4 py-2.5 text-sm font-semibold rounded-full bg-gray-800 border border-gray-600/50 text-gray-300 hover:bg-gray-700 hover:text-white transition-all flex items-center gap-2"
            >
              <Edit3 size={16} /> Edit
            </button>
            <button 
              onClick={() => setIsDeleteCourseModalOpen(true)}
              className="px-4 py-2.5 text-sm font-semibold rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all flex items-center gap-2"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
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
                    
                    {/* Updated Export Button */}
                    <button 
                      onClick={(e) => handleExportPDF(quiz, e)}
                      disabled={exportingQuizId === quiz.quiz_id}
                      className="px-4 py-2 text-xs font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {exportingQuizId === quiz.quiz_id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      Export
                    </button>
                    
                    <button 
                      onClick={(e) => handleDeleteQuizRequest(quiz, e)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                      title="Delete Quiz"
                    >
                      <Trash2 size={16} />
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