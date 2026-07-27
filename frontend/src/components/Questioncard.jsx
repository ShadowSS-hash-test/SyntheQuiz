import React from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Info } from 'lucide-react';

const QuestionCard = ({ q, index, theme, hasExplanation, expanded, onToggleKeep, onToggleExplanation }) => {
  const isTrueFalse = q.type === 'true_false';

  return (
    <div
      className={`group relative rounded-3xl border p-6 backdrop-blur-md shadow-xl transition-all duration-300 ${
        q.kept ? 'bg-gray-800/40 border-gray-500/30' : 'bg-gray-900/20 border-gray-700/30 opacity-60 grayscale'
      }`}
    >
      <div
        className={`absolute -top-3 -right-3 select-none rotate-12 rounded-lg border-2 border-dashed px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-gray-900/80 ${
          q.kept ? `${theme.stampBorder} ${theme.stampText}` : 'border-gray-600 text-gray-500'
        }`}
      >
        {q.kept ? 'Keeping' : 'Skipped'}
      </div>

      <div className="flex items-start gap-4">
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

export default QuestionCard;