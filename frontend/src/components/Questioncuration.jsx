import React, { useState } from 'react';
import {
  ArrowLeft, Sparkles, CheckCircle2, Circle, ChevronDown, ChevronUp,
  FileQuestion, Loader2, ClipboardCheck, Info, Minus, Plus, SlidersHorizontal, Pencil
} from 'lucide-react';

// ── Mock data ────────────────────────────────────────────────────────────
// TODO: replace with the real payload returned from POST /rag/generate or
// the plain-text generation endpoint. Shape matches RAGQuizQuestion /
// QuizQuestion pydantic schemas (explanation omitted for the RAG path).
const INITIAL_QUESTIONS = [
  {
    id: 1,
    type: 'mcq',
    question: 'What is the time complexity of searching for a value in a balanced binary search tree?',
    options: { A: 'O(n)', B: 'O(log n)', C: 'O(n log n)', D: 'O(1)' },
    correct_answer: 'B',
    explanation: 'A balanced BST halves the search space at each step, giving logarithmic height and lookup time.',
  },
  {
    id: 2,
    type: 'true_false',
    question: "In a binary search tree, the left subtree of a node contains only values greater than the node's value.",
    options: { T: 'True', F: 'False' },
    correct_answer: 'F',
    explanation: 'The left subtree holds values smaller than the node; the right subtree holds larger values.',
  },
  {
    id: 3,
    type: 'mcq',
    question: 'Which traversal of a binary search tree visits nodes in ascending sorted order?',
    options: { A: 'Pre-order', B: 'Post-order', C: 'In-order', D: 'Level-order' },
    correct_answer: 'C',
    explanation: 'In-order traversal visits left subtree, node, then right subtree, which yields sorted order for a BST.',
  },
  {
    id: 4,
    type: 'true_false',
    question: 'A degenerate (skewed) binary search tree behaves like a linked list in the worst case.',
    options: { T: 'True', F: 'False' },
    correct_answer: 'T',
    explanation: 'If nodes are inserted in sorted order without balancing, the tree loses its branching structure entirely.',
  },
  {
    id: 5,
    type: 'mcq',
    question: 'What is the primary purpose of tree rotations in an AVL tree?',
    options: { A: 'To delete duplicate nodes', B: 'To restore balance after insertion or deletion', C: "To convert the tree into a heap", D: "To sort the tree's values" },
    correct_answer: 'B',
    explanation: 'Rotations rebalance subtrees so the height difference between left and right children stays within one.',
  },
  {
    id: 6,
    type: 'mcq',
    question: 'What is the maximum number of children a node can have in a standard binary tree?',
    options: { A: '1', B: '2', C: '3', D: '4' },
    correct_answer: 'B',
    explanation: 'By definition, a binary tree node has at most a left child and a right child.',
  },
  {
    id: 7,
    type: 'true_false',
    question: 'Red-black trees guarantee that the longest path from root to leaf is no more than twice the length of the shortest path.',
    options: { T: 'True', F: 'False' },
    correct_answer: 'T',
    explanation: "The red-black coloring rules bound how skewed any root-to-leaf path can get relative to another.",
  },
  {
    id: 8,
    type: 'mcq',
    question: 'What is the worst-case time complexity of insertion into an unbalanced binary search tree?',
    options: { A: 'O(log n)', B: 'O(1)', C: 'O(n)', D: 'O(n^2)' },
    correct_answer: 'C',
    explanation: 'Without balancing, an adversarial insertion order can produce a linked-list-shaped tree of height n.',
  },
  {
    id: 9,
    type: 'true_false',
    question: 'Every valid binary search tree is also a valid AVL tree.',
    options: { T: 'True', F: 'False' },
    correct_answer: 'F',
    explanation: 'AVL trees add a balance constraint; a BST only satisfies AVL rules if that constraint also holds.',
  },
].map(q => ({ ...q, kept: true }));

const EXTRA_QUESTION_POOL = [
  {
    type: 'mcq',
    question: 'What distinguishes a B-tree from a standard binary search tree?',
    options: { A: 'B-trees allow more than two children per node', B: 'B-trees cannot store duplicate keys', C: 'B-trees are always perfectly balanced by definition', D: 'B-trees only store integer keys' },
    correct_answer: 'A',
    explanation: 'B-trees are designed for disk-backed storage, so nodes hold many keys and children to reduce tree height.',
  },
  {
    type: 'true_false',
    question: 'A min-heap guarantees that every element is smaller than all elements below it in the tree.',
    options: { T: 'True', F: 'False' },
    correct_answer: 'T',
    explanation: 'The heap property requires each parent to be less than or equal to its children throughout the structure.',
  },
  {
    type: 'mcq',
    question: 'What is the balance factor of a node in an AVL tree calculated as?',
    options: { A: 'Left height minus right height', B: 'Number of children minus one', C: 'Depth minus total node count', D: 'Right height divided by left height' },
    correct_answer: 'A',
    explanation: "A node's balance factor is the height difference between its left and right subtrees, kept within [-1, 1].",
  },
  {
    type: 'true_false',
    question: 'A splay tree moves recently accessed nodes closer to the root.',
    options: { T: 'True', F: 'False' },
    correct_answer: 'T',
    explanation: 'Splaying restructures the tree on every access so frequently used nodes become cheaper to reach again.',
  },
  {
    type: 'mcq',
    question: 'In a trie, what does each edge typically represent?',
    options: { A: 'A full stored word', B: 'A single character', C: 'A hash bucket index', D: 'A pointer to a sibling only' },
    correct_answer: 'B',
    explanation: 'Tries branch one character at a time, letting common prefixes across words share the same path.',
  },
  {
    type: 'mcq',
    question: 'What happens to a binary search tree if you repeatedly insert already-sorted data with no rebalancing?',
    options: { A: 'It stays perfectly balanced', B: 'It degrades toward a linked list', C: 'It automatically converts to a heap', D: 'Insertions begin to fail' },
    correct_answer: 'B',
    explanation: 'Sorted input with no balancing pushes every new node to one side, stretching the tree into a single chain.',
  },
];

let idCounter = 1000;

// Same course list as CreateQuiz.jsx — swap for the real GET /courses response
const COURSES = [
  { id: 1, code: 'CS101', title: 'Introduction to Computer Science' },
  { id: 2, code: 'CS201', title: 'Data Structures & Algorithms' },
  { id: 3, code: 'BIO301', title: 'Cellular & Molecular Biology' },
];

const QUESTION_TYPE_OPTIONS = [
  { key: 'mixed', label: 'Mixed' },
  { key: 'mcq', label: 'Multiple Choice' },
  { key: 'true_false', label: 'True / False' },
];

const THEMES = {
  upload: {
    label: 'text-blue-400',
    chip: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    solidBtn: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20',
    stat: 'text-blue-400',
    stampBorder: 'border-blue-500/50',
    stampText: 'text-blue-300',
  },
  topic: {
    label: 'text-purple-400',
    chip: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
    solidBtn: 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20',
    stat: 'text-purple-400',
    stampBorder: 'border-purple-500/50',
    stampText: 'text-purple-300',
  },
};

const QuestionCard = ({ q, index, theme, hasExplanation, expanded, onToggleKeep, onToggleExplanation }) => {
  const isTrueFalse = q.type === 'true_false';

  return (
    <div
      className={`group relative rounded-3xl border p-6 backdrop-blur-md shadow-xl transition-all duration-300 ${
        q.kept ? 'bg-gray-800/40 border-gray-500/30' : 'bg-gray-900/20 border-gray-700/30 opacity-60 grayscale'
      }`}
    >
      {/* Stamp */}
      <div
        className={`absolute -top-3 -right-3 select-none rotate-12 rounded-lg border-2 border-dashed px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-gray-900/80 ${
          q.kept ? `${theme.stampBorder} ${theme.stampText}` : 'border-gray-600 text-gray-500'
        }`}
      >
        {q.kept ? 'Keeping' : 'Skipped'}
      </div>

      <div className="flex items-start gap-4">
        {/* Keep / unpick toggle */}
        <button
          onClick={onToggleKeep}
          className="mt-1 shrink-0"
          aria-label={q.kept ? 'Unpick question' : 'Pick question'}
        >
          {q.kept ? (
            <CheckCircle2 size={26} className={theme.stat} />
          ) : (
            <Circle size={26} className="text-gray-600 hover:text-gray-400 transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-gray-500">Q{index}</span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                isTrueFalse ? 'bg-gray-700/40 border-gray-600/40 text-gray-300' : theme.chip
              }`}
            >
              {isTrueFalse ? 'True / False' : 'Multiple Choice'}
            </span>
          </div>

          <p className="text-white font-semibold leading-relaxed mb-4">{q.question}</p>

          <div className={`grid gap-2 ${isTrueFalse ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
            {Object.entries(q.options).map(([key, label]) => {
              const isCorrect = key === q.correct_answer;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${
                    isCorrect ? 'bg-green-500/10 border-green-500/40 text-green-300' : 'bg-gray-900/40 border-gray-600/30 text-gray-300'
                  }`}
                >
                  <span
                    className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold border ${
                      isCorrect ? 'border-green-500/50 text-green-300' : 'border-gray-600/40 text-gray-400'
                    }`}
                  >
                    {key}
                  </span>
                  <span className="flex-1">{label}</span>
                  {isCorrect && <CheckCircle2 size={16} className="text-green-400 shrink-0" />}
                </div>
              );
            })}
          </div>

          {hasExplanation && q.explanation && (
            <div className="mt-3">
              <button
                onClick={onToggleExplanation}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                <Info size={13} /> {expanded ? 'Hide explanation' : 'Show explanation'}
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {expanded && (
                <p className="mt-2 text-sm text-gray-400 leading-relaxed bg-gray-900/40 border border-gray-700/40 rounded-xl p-3">
                  {q.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QuestionCuration = ({
  topic: initialTopic = 'Binary Search Trees & Balanced Trees',
  courseId: initialCourseId = 2,
  difficulty: initialDifficulty = 'medium',
  mode = 'topic', // 'topic' | 'upload' — controls accent color and whether explanations exist
  documentId = null, // set for the RAG path (mode="upload"); null for plain-text
  documentName = null, // just for display, e.g. "lecture_notes_ch4.pdf"
  onBack,
  onSave,
}) => {
  const [questions, setQuestions] = useState(INITIAL_QUESTIONS);
  const [expanded, setExpanded] = useState({});
  const [generateCount, setGenerateCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // "Active" settings — what the quiz is currently generated with, shown in
  // the header/badges. The header title itself is a quick, instant rename.
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [topic, setTopic] = useState(initialTopic);
  const [courseId, setCourseId] = useState(initialCourseId);
  const [difficulty, setDifficulty] = useState(initialDifficulty);

  // "Draft" settings panel — editing these does NOT touch the values above.
  // They only take effect (and the header updates) once you hit
  // "Generate more", which commits the draft and generates with it.
  const [draftTopic, setDraftTopic] = useState(initialTopic);
  const [draftCourseId, setDraftCourseId] = useState(initialCourseId);
  const [draftDifficulty, setDraftDifficulty] = useState(initialDifficulty);
  const [questionTypeFilter, setQuestionTypeFilter] = useState('mixed');

  const theme = THEMES[mode] || THEMES.topic;
  const hasExplanation = mode !== 'upload';
  const keptCount = questions.filter(q => q.kept).length;
  const totalCount = questions.length;
  const selectedCourse = COURSES.find(c => c.id === courseId) || COURSES[0];

  const toggleKeep = id => setQuestions(qs => qs.map(q => (q.id === id ? { ...q, kept: !q.kept } : q)));
  const toggleExplanation = id => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const selectAll = () => setQuestions(qs => qs.map(q => ({ ...q, kept: true })));
  const deselectAll = () => setQuestions(qs => qs.map(q => ({ ...q, kept: false })));

  const handleToggleSettings = () => {
    if (!settingsOpen) {
      // Re-sync the draft to whatever is currently active every time the
      // panel opens, so it never shows stale values from a prior session.
      setDraftTopic(topic);
      setDraftCourseId(courseId);
      setDraftDifficulty(difficulty);
    }
    setSettingsOpen(o => !o);
  };

  const handleGenerateMore = () => {
    setIsGenerating(true);
    // Commit the draft settings now — this is the one moment they become
    // "live" and the header/badges update to match.
    setTopic(draftTopic);
    setCourseId(draftCourseId);
    setDifficulty(draftDifficulty);
    // TODO: wire up POST /rag/generate (mode="upload") or the plain-text
    // generation endpoint (mode="topic") here, passing:
    // { topic: draftTopic, difficulty: draftDifficulty, course_id: draftCourseId,
    //   question_type: questionTypeFilter, document_id: mode === 'upload' ? documentId : null }
    // plus the current question set so the model can avoid duplicates.
    const pool = questionTypeFilter === 'mixed'
      ? EXTRA_QUESTION_POOL
      : EXTRA_QUESTION_POOL.filter(q => q.type === questionTypeFilter);
    const source = pool.length > 0 ? pool : EXTRA_QUESTION_POOL;

    setTimeout(() => {
      const newOnes = Array.from({ length: Number(generateCount) }, (_, i) => {
        const template = source[(idCounter + i) % source.length];
        idCounter += 1;
        return { ...template, id: idCounter, kept: true };
      });
      setQuestions(qs => [...qs, ...newOnes]);
      setIsGenerating(false);
    }, 1300);
  };

  const handleSave = () => {
    const finalQuestions = questions.filter(q => q.kept);
    setIsSaving(true);
    // Shape matches SaveQuizRequest — course_id/document_id/quiz_type are
    // fixed per this screen, not editable settings, since a document-grounded
    // quiz can't switch documents without re-running the embedding pipeline.
    const payload = {
      course_id: courseId,
      document_id: mode === 'upload' ? documentId : null,
      quiz_type: mode === 'upload' ? 'rag' : 'plain_text',
      topic,
      difficulty,
      questions: finalQuestions,
    };
    // TODO: wire up POST /quizzes/ with this payload
    console.log('Saving quiz:', payload);
    setTimeout(() => {
      setIsSaving(false);
      if (onSave) {
        onSave(payload);
      } else {
        alert(`Quiz saved with ${finalQuestions.length} questions! (Placeholder)`);
      }
    }, 900);
  };

  return (
    <div className="relative min-h-screen bg-gray-950 overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/20 blur-[100px]" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-purple-600/20 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto animate-fade-in-up px-4 sm:px-6 py-10 pb-32">
      <button
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back to settings
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${theme.label}`}>Review &amp; Curate</p>
          <div className="group relative mb-2">
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              aria-label="Quiz topic — click to rename"
              title="Click to rename the quiz topic"
              className={`text-3xl font-bold text-white bg-transparent border-b-2 border-dashed border-gray-600/50 hover:border-gray-500 focus:outline-none focus:border-solid w-full pr-9 -ml-0.5 pl-0.5 rounded-sm transition-colors ${
                mode === 'upload' ? 'focus:border-blue-500' : 'focus:border-purple-500'
              }`}
            />
            <Pencil
              size={16}
              className={`absolute right-1 top-1/2 -translate-y-1/2 opacity-40 group-hover:opacity-90 group-focus-within:opacity-90 transition-opacity pointer-events-none ${theme.stat}`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span className="px-3 py-1 rounded-full bg-gray-800/60 border border-gray-600/40">{selectedCourse.code} · {selectedCourse.title}</span>
            <span className="px-3 py-1 rounded-full bg-gray-800/60 border border-gray-600/40 capitalize">{difficulty} difficulty</span>
            <span className={`px-3 py-1 rounded-full border capitalize ${theme.chip}`}>
              {mode === 'upload' ? `Grounded in ${documentName || 'document'}` : 'Topic generated'}
            </span>
            <button
              onClick={handleToggleSettings}
              className="ml-1 inline-flex items-center gap-1 px-3 py-1 rounded-full border border-gray-600/40 text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
            >
              <SlidersHorizontal size={12} /> Edit settings
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

      {/* Generation settings — a draft. Nothing here (or in the header)
          changes until you click "Generate more" below, which commits
          these values and generates the next batch with them. Already-kept
          questions are left exactly as they were originally generated. */}
      {settingsOpen && (
        <div className="mb-6 bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-2xl p-5 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-gray-400">Topic / focus</label>
              <input
                value={draftTopic}
                onChange={e => setDraftTopic(e.target.value)}
                placeholder="e.g. Binary search trees, focused on balancing"
                className="w-full bg-gray-900/50 border border-gray-600/40 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Course</label>
              <div className="relative">
                <select
                  value={draftCourseId}
                  onChange={e => setDraftCourseId(Number(e.target.value))}
                  className="w-full bg-gray-900/50 border border-gray-600/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                >
                  {COURSES.map(c => (
                    <option key={c.id} value={c.id} className="bg-gray-800 text-white">
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Difficulty</label>
              <div className="relative">
                <select
                  value={draftDifficulty}
                  onChange={e => setDraftDifficulty(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-600/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
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
                {QUESTION_TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setQuestionTypeFilter(opt.key)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                      questionTypeFilter === opt.key
                        ? theme.chip
                        : 'bg-gray-900/50 border-gray-600/40 text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
            <Info size={12} /> These changes apply the moment you click "Generate more" below.
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-gray-800/40 backdrop-blur-md border border-gray-500/30 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-600/40 text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
          >
            Select all
          </button>
          <button
            onClick={deselectAll}
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-600/40 text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
          >
            Deselect all
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-900/50 border border-gray-600/40 rounded-lg overflow-hidden">
            <button
              onClick={() => setGenerateCount(c => Math.max(1, c - 1))}
              className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Decrease count"
            >
              <Minus size={14} />
            </button>
            <span className="px-2 text-sm font-semibold text-white w-6 text-center">{generateCount}</span>
            <button
              onClick={() => setGenerateCount(c => Math.min(10, c + 1))}
              className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Increase count"
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            onClick={handleGenerateMore}
            disabled={isGenerating}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme.solidBtn}`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Generate {generateCount} more
              </>
            )}
          </button>
        </div>
      </div>

      {/* Question list */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            q={q}
            index={idx + 1}
            theme={theme}
            hasExplanation={hasExplanation}
            expanded={!!expanded[q.id]}
            onToggleKeep={() => toggleKeep(q.id)}
            onToggleExplanation={() => toggleExplanation(q.id)}
          />
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <FileQuestion size={40} className="mx-auto mb-4 opacity-50" />
          <p className="font-semibold text-gray-400">No questions left</p>
          <p className="text-sm mt-1">Generate more questions to keep building this quiz.</p>
        </div>
      )}

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="max-w-5xl mx-auto px-4 pb-6">
          <div className="flex items-center justify-between gap-4 bg-gray-900/80 backdrop-blur-xl border border-gray-600/40 rounded-2xl px-6 py-4 shadow-2xl">
            <p className="text-sm text-gray-300">
              <span className="font-bold text-white">{keptCount}</span> of {totalCount} questions selected
            </p>
            <button
              onClick={handleSave}
              disabled={keptCount === 0 || isSaving}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${theme.solidBtn}`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <ClipboardCheck size={16} /> Save Quiz ({keptCount})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default QuestionCuration;