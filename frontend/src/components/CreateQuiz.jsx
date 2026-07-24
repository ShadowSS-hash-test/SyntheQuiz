import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, Type, UploadCloud, ArrowLeft, Settings2, FileUp, X, BookOpen, ChevronDown, Database } from 'lucide-react';

const CreateQuiz = () => {
  const [mode, setMode] = useState('select'); // 'select' | 'upload' | 'topic' | 'existing'

  // Form States
  const [courses, setCourses] = useState([]);
  const [documents, setDocuments] = useState([]); // Added to hold existing documents
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(''); // Added for existing mode
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [file, setFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch educator's courses and existing documents on mount
  useEffect(() => {
    // Mock courses
    setCourses([
      { id: 1, title: 'Introduction to Computer Science', code: 'CS101' },
      { id: 2, title: 'Data Structures & Algorithms', code: 'CS201' },
      { id: 3, title: 'Cellular & Molecular Biology', code: 'BIO301' },
    ]);

    // Mock previously uploaded documents
    setDocuments([
      { id: 1, filename: 'CS201_Syllabus_Fall2026.pdf', courseCode: 'CS201' },
      { id: 2, filename: 'Lecture_4_Trees_and_Graphs.docx', courseCode: 'CS201' },
      { id: 3, filename: 'Cell_Division_Notes_Ch5.pdf', courseCode: 'BIO301' },
    ]);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const clearFile = () => setFile(null);

  const handleGenerate = (e) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // TODO: Wire up your FastAPI RAG or LLM endpoint here
    const payload = {
      courseId: selectedCourse,
      mode,
      topic,
      difficulty,
      questionCount,
      file: mode === 'upload' && file ? file.name : null,
      documentId: mode === 'existing' ? selectedDocument : null
    };
    
    console.log("Generating with payload:", payload);

    setTimeout(() => {
      setIsGenerating(false);
      alert("Generation complete! (Placeholder)");
    }, 2000);
  };

  // Determine active theme colors based on mode
  const getTheme = () => {
    if (mode === 'upload') return { color: 'blue', text: 'text-blue-400', bg: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' };
    if (mode === 'existing') return { color: 'emerald', text: 'text-emerald-400', bg: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' };
    return { color: 'purple', text: 'text-purple-400', bg: 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20' };
  };
  
  const theme = getTheme();

  // ── VIEW 1: SELECTION SCREEN ─────────────────────────────────────────────
  if (mode === 'select') {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in-up">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Quiz Generator</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">How do you want to build this quiz?</h1>
          <p className="text-gray-400 max-w-xl mx-auto">Choose a generation method. You can upload new material, reuse existing documents, or generate from scratch.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Upload New File Option */}
          <button 
            onClick={() => setMode('upload')}
            className="group flex flex-col items-center text-center rounded-3xl p-8 border border-gray-500/30 bg-gray-800/40 backdrop-blur-md hover:border-blue-500/50 hover:bg-gray-800/80 transition-all duration-300 shadow-xl"
          >
            <div className="w-16 h-16 mb-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
              <FileUp size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Upload File</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Upload a new PDF or DOCX. The AI will embed it and generate questions strictly based on its contents.
            </p>
          </button>

          {/* Existing Document Option */}
          <button 
            onClick={() => setMode('existing')}
            className="group flex flex-col items-center text-center rounded-3xl p-8 border border-gray-500/30 bg-gray-800/40 backdrop-blur-md hover:border-emerald-500/50 hover:bg-gray-800/80 transition-all duration-300 shadow-xl"
          >
            <div className="w-16 h-16 mb-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
              <Database size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Existing Document</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Select a file you've already uploaded to your vector database to generate a new set of questions.
            </p>
          </button>

          {/* Topic Only Option */}
          <button 
            onClick={() => setMode('topic')}
            className="group flex flex-col items-center text-center rounded-3xl p-8 border border-gray-500/30 bg-gray-800/40 backdrop-blur-md hover:border-purple-500/50 hover:bg-gray-800/80 transition-all duration-300 shadow-xl"
          >
            <div className="w-16 h-16 mb-5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
              <Type size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Topic / Text</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              No source file? Just type a subject and let the AI generate questions using its general knowledge.
            </p>
          </button>
        </div>
      </div>
    );
  }

  // ── VIEW 2: FORM CONTROLS ──────────────────────────────
  
  // Logic to determine if the form is valid to submit
  const isSubmitDisabled = isGenerating || 
    (mode === 'upload' && !file) || 
    (mode === 'existing' && !selectedDocument);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up pb-20">
      {/* Back Navigation */}
      <button
        onClick={() => {
          setMode('select');
          setFile(null);
          setSelectedDocument('');
        }}
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back to options
      </button>

      <div className="mb-8">
        <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${theme.text}`}>
          {mode === 'topic' ? 'Standard Generation' : 'Context-Aware Generation'}
        </p>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          {mode === 'upload' && <FileUp className={theme.text} />}
          {mode === 'existing' && <Database className={theme.text} />}
          {mode === 'topic' && <Type className={theme.text} />}
          
          {mode === 'upload' && 'Upload Course Material'}
          {mode === 'existing' && 'Select Knowledge Base Document'}
          {mode === 'topic' && 'Define Quiz Topic'}
        </h1>
      </div>

      <form onSubmit={handleGenerate} className="space-y-8">
        
        {/* Course Assignment */}
        <div className="bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-3xl p-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen size={20} className={theme.text} /> Assign to Course
          </h2>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300 ml-1">Select a course to save this quiz</label>
            <div className="relative">
              <select
                required
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled className="bg-gray-800 text-gray-400">-- Select a Course --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id} className="bg-gray-800 text-white">
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Existing Document Selection Area */}
        {mode === 'existing' && (
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-3xl p-8 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Database size={20} className={theme.text} /> Select Source Document
            </h2>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 ml-1">Choose a previously uploaded file</label>
              <div className="relative">
                <select
                  required
                  value={selectedDocument}
                  onChange={(e) => setSelectedDocument(e.target.value)}
                  className={`w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-${theme.color}-500 transition-colors appearance-none cursor-pointer`}
                >
                  <option value="" disabled className="bg-gray-800 text-gray-400">-- Select a Document --</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id} className="bg-gray-800 text-white">
                      {doc.filename} ({doc.courseCode})
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Document Upload Area */}
        {mode === 'upload' && (
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-3xl p-8 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UploadCloud size={20} className={theme.text} /> Upload Document
            </h2>
            
            {!file ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600/50 rounded-2xl hover:border-blue-500/50 hover:bg-gray-800/50 transition-all cursor-pointer">
                <UploadCloud size={36} className="text-gray-400 mb-3" />
                <p className="text-sm text-white font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PDF, TXT, or DOCX (Max 10MB)</p>
                <input type="file" className="hidden" accept=".pdf,.txt,.docx" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-600/50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button type="button" onClick={clearFile} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                  <X size={20} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Configuration Settings */}
        <div className="bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-3xl p-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Settings2 size={20} className={theme.text} /> 
            Quiz Settings
          </h2>
          
          <div className="space-y-6">
            {/* Topic Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 ml-1">
                {mode === 'topic' ? 'What is the quiz about?' : 'Specific focus (Optional)'}
              </label>
              <textarea
                required={mode === 'topic'}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className={`w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-${theme.color}-500 focus:ring-1 focus:ring-${theme.color}-500 transition-colors placeholder-gray-500 h-24 resize-none`}
                placeholder={mode === 'topic' ? 'e.g., Advanced JavaScript concepts, closures, and promises...' : 'e.g., Focus specifically on chapters 3 and 4...'}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Difficulty */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 ml-1">Difficulty Level</label>
                <div className="relative">
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className={`w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-${theme.color}-500 transition-colors appearance-none cursor-pointer`}
                  >
                    <option value="easy" className="bg-gray-800 text-white">Beginner / Easy</option>
                    <option value="medium" className="bg-gray-800 text-white">Intermediate / Medium</option>
                    <option value="hard" className="bg-gray-800 text-white">Advanced / Hard</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Number of Questions */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 ml-1">Number of Questions: {questionCount}</label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-${theme.color}-500 mt-3`}
                />
                <div className="flex justify-between text-xs text-gray-500 px-1">
                  <span>5</span>
                  <span>30</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`px-8 py-4 text-sm font-bold rounded-full shadow-lg transition-all flex items-center gap-2 ${theme.bg} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isGenerating ? (
              <span className="animate-pulse flex items-center gap-2">Generating...</span>
            ) : (
              <>
                <Sparkles size={18} /> Generate Quiz
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuiz;