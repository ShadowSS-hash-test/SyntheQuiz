import React, { useState } from 'react';
import {
  ArrowLeft, Sparkles, CheckCircle2, Loader2, Save, Info, Minus, Plus,
  SlidersHorizontal, ChevronDown, ChevronUp,
} from 'lucide-react';
import QuestionCard from './QuestionCard';

const QUESTION_TYPE_OPTIONS = [
  { key: 'mcq', label: 'Multiple Choice' },
  { key: 'true_false', label: 'True / False' },
];

let clientIdCounter = 0;
const normalize = (rawQuestions) =>
  (rawQuestions || []).map((q) => ({ ...q, _cid: `c${clientIdCounter++}`, kept: true }));

const QuizCuration = ({
  submittedMode,
  initialQuestions,
  initialTopic = '',
  initialDifficulty = 'medium',
  initialQuestionType = 'mcq',
  initialCourseId = '',
  initialDocumentId = null,
  userId,
  generateStandardQuiz,
  generateDocumentQuiz,
  isSaving = false,
  theme,
  onDiscard,
  onSave,
}) => {
  const [questions, setQuestions] = useState(() => normalize(initialQuestions));
  const [expanded, setExpanded] = useState({});
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // MAIN QUIZ IDENTITY (Locked from Step 1)
  // These are preserved exactly as they came in so the entire question pool 
  // saves under a single consistent quiz record in the database.
  const [topic] = useState(initialTopic);
  const [courseId] = useState(initialCourseId);
  const [documentId] = useState(initialDocumentId);
  const [difficulty] = useState(initialDifficulty);

  // GENERATION PARAMETERS (For the *next* batch of questions)
  const [draftTopic, setDraftTopic] = useState(initialTopic);
  const [draftDifficulty, setDraftDifficulty] = useState(initialDifficulty);
  const [draftQuestionType, setDraftQuestionType] = useState(initialQuestionType);
  const [generateMoreCount, setGenerateMoreCount] = useState(5);

  const keptCount = questions.filter((q) => q.kept).length;
  const totalCount = questions.length;
  const isRagMode = submittedMode !== 'topic';

  const toggleKeep = (cid) =>
    setQuestions((qs) => qs.map((q) => (q._cid === cid ? { ...q, kept: !q.kept } : q)));
  const toggleExplanation = (cid) => setExpanded((e) => ({ ...e, [cid]: !e[cid] }));
  const selectAll = () => setQuestions((qs) => qs.map((q) => ({ ...q, kept: true })));
  const deselectAll = () => setQuestions((qs) => qs.map((q) => ({ ...q, kept: false })));

  const handleToggleSettings = () => {
    setSettingsOpen((o) => !o);
  };

  const handleGenerateMore = async () => {
    setIsGeneratingMore(true);

    try {
      let result = [];
      if (submittedMode === 'topic') {
        result = await generateStandardQuiz({
          topic: draftTopic,
          numQuestions: Number(generateMoreCount),
          difficulty: draftDifficulty,
          questionType: draftQuestionType,
        });
      } else {
        result = await generateDocumentQuiz({
          documentId: documentId, // Force use of the locked main documentId
          userId,
          topic: draftTopic,
          numQuestions: Number(generateMoreCount),
          difficulty: draftDifficulty,
          questionType: draftQuestionType,
        });
      }
      // Simply append the new questions to the current quiz pool
      setQuestions((prev) => [...prev, ...normalize(result)]);
    } catch (err) {
      // Errors already toasted inside the store actions.
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const handleSave = () => {
    const finalQuestions = questions.filter((q) => q.kept).map(({ _cid, kept, ...rest }) => rest);
    if (!finalQuestions.length) return;
    
    // Save uses the locked, overarching quiz identity
    onSave({
      courseId: courseId || null,
      documentId: submittedMode === 'topic' ? null : documentId,
      quizType: submittedMode === 'topic' ? 'plain_text' : 'rag',
      topic,
      difficulty,
      questions: finalQuestions,
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up pb-32">
      <button
        onClick={onDiscard}
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Discard & start over
      </button>

      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${theme.text}`}>Step 2 of 2</p>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <CheckCircle2 className={theme.text} /> Review Generated Questions
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span className="px-3 py-1 rounded-full bg-gray-800/60 border border-gray-600/40 capitalize">{difficulty} difficulty</span>
            <span className={`px-3 py-1 rounded-full border capitalize ${theme.chip}`}>
              {isRagMode ? 'Document grounded' : 'Topic generated'}
            </span>
            <button
              onClick={handleToggleSettings}
              className="ml-1 inline-flex items-center gap-1 px-3 py-1 rounded-full border border-gray-600/40 text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
            >
              <SlidersHorizontal size={12} /> Generation settings
              {settingsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-2xl px-6 py-4 shadow-xl">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{totalCount}</p>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Generated</p>
          </div>
          <div className="w-px h-8 bg-gray-600/40" />
          <div className="text-center">
            <p className={`text-2xl font-bold ${theme.stat}`}>{keptCount}</p>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Keeping</p>
          </div>
          <div className="w-px h-8 bg-gray-600/40" />
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-500">{totalCount - keptCount}</p>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Skipped</p>
          </div>
        </div>
      </div>

      {settingsOpen && (
        <div className="mb-6 bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-2xl p-5 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-gray-400">
                Focus for new questions (optional)
              </label>
              <input
                value={draftTopic}
                onChange={(e) => setDraftTopic(e.target.value)}
                placeholder="e.g. Binary search trees, focused on balancing"
                className="w-full bg-gray-900/50 border border-gray-600/40 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Difficulty for new questions</label>
              <div className="relative">
                <select
                  value={draftDifficulty}
                  onChange={(e) => setDraftDifficulty(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-600/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                >
                  <option value="easy" className="bg-gray-800 text-white">Beginner / Easy</option>
                  <option value="medium" className="bg-gray-800 text-white">Intermediate / Medium</option>
                  <option value="hard" className="bg-gray-800 text-white">Advanced / Hard</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-gray-400">Question type for new questions</label>
              <div className="flex flex-wrap gap-2">
                {QUESTION_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setDraftQuestionType(opt.key)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                      draftQuestionType === opt.key ? theme.chip : 'bg-gray-900/50 border-gray-600/40 text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
            <Info size={12} /> These apply to the next batch only. The main quiz metadata remains unchanged.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <button onClick={selectAll} className="text-xs font-semibold px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-600/40 text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
            Select all
          </button>
          <button onClick={deselectAll} className="text-xs font-semibold px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-600/40 text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
            Deselect all
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-900/50 border border-gray-600/40 rounded-lg overflow-hidden">
            <button onClick={() => setGenerateMoreCount((c) => Math.max(1, c - 1))} className="px-3 py-2 text-gray-400 hover:text-white transition-colors" aria-label="Decrease count">
              <Minus size={14} />
            </button>
            <span className="px-2 text-sm font-semibold text-white w-6 text-center">{generateMoreCount}</span>
            <button onClick={() => setGenerateMoreCount((c) => Math.min(10, c + 1))} className="px-3 py-2 text-gray-400 hover:text-white transition-colors" aria-label="Increase count">
              <Plus size={14} />
            </button>
          </div>
          <button
            onClick={handleGenerateMore}
            disabled={isGeneratingMore}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme.solidBtn}`}
          >
            {isGeneratingMore ? (
              <><Loader2 size={14} className="animate-spin" /> Generating...</>
            ) : (
              <><Sparkles size={14} /> Generate {generateMoreCount} more</>
            )}
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="bg-gray-800/40 border border-gray-500/30 rounded-3xl p-10 text-center text-gray-400">
          No questions left to save. Generate more, or go back and start over.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <QuestionCard
              key={q._cid}
              q={q}
              index={idx + 1}
              theme={theme}
              hasExplanation={!isRagMode}
              expanded={!!expanded[q._cid]}
              onToggleKeep={() => toggleKeep(q._cid)}
              onToggleExplanation={() => toggleExplanation(q._cid)}
            />
          ))}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="max-w-4xl mx-auto px-4 pb-6">
          <div className="flex items-center justify-between gap-4 bg-gray-900/80 backdrop-blur-xl border border-gray-600/40 rounded-2xl px-6 py-4 shadow-2xl">
            <p className="text-sm text-gray-300">
              <span className="font-bold text-white">{keptCount}</span> of {totalCount} questions selected
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onDiscard}
                className="px-5 py-3 text-sm font-bold rounded-full border border-gray-600/50 text-gray-300 hover:text-white hover:border-gray-500 transition-all"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || keptCount === 0}
                className={`px-6 py-3 text-sm font-bold rounded-full shadow-lg transition-all flex items-center gap-2 ${theme.bg} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSaving ? (
                  <><Loader2 size={18} className="animate-spin" /> Saving...</>
                ) : (
                  <><Save size={18} /> Save Quiz ({keptCount})</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizCuration;