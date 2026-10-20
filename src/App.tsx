import { useState, useCallback } from 'react';
import { problems, categories, Problem } from './data/problems';

type Screen = 'home' | 'category' | 'problem' | 'results';

interface Stats {
  correct: number;
  wrong: number;
  total: number;
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [stats, setStats] = useState<Stats>({ correct: 0, wrong: 0, total: 0 });
  const [categoryStats, setCategoryStats] = useState<Record<string, Stats>>({});
  const [animateCorrect, setAnimateCorrect] = useState(false);
  const [animateWrong, setAnimateWrong] = useState(false);

  const getCategoryProblems = useCallback(
    () => problems.filter((p) => p.category === selectedCategory),
    [selectedCategory]
  );

  const currentProblem: Problem | undefined = getCategoryProblems()[currentProblemIndex];

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentProblemIndex(0);
    setUserAnswer('');
    setShowResult(false);
    setShowHint(false);
    setScreen('category');
  };

  const handleCheckAnswer = () => {
    if (!currentProblem || !userAnswer.trim()) return;

    const isCorrect =
      userAnswer.trim().toLowerCase() === currentProblem.answer.toLowerCase();

    setShowResult(true);
    setShowHint(false);

    if (isCorrect) {
      setAnimateCorrect(true);
      setTimeout(() => setAnimateCorrect(false), 600);
      setStats((s) => ({ ...s, correct: s.correct + 1, total: s.total + 1 }));
    } else {
      setAnimateWrong(true);
      setTimeout(() => setAnimateWrong(false), 600);
      setStats((s) => ({ ...s, wrong: s.wrong + 1, total: s.total + 1 }));
    }

    setCategoryStats((prev) => {
      const catStats = prev[selectedCategory] || { correct: 0, wrong: 0, total: 0 };
      return {
        ...prev,
        [selectedCategory]: {
          correct: catStats.correct + (isCorrect ? 1 : 0),
          wrong: catStats.wrong + (isCorrect ? 0 : 1),
          total: catStats.total + 1,
        },
      };
    });
  };

  const handleNext = () => {
    const catProblems = getCategoryProblems();
    if (currentProblemIndex < catProblems.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
      setUserAnswer('');
      setShowResult(false);
      setShowHint(false);
    } else {
      setScreen('results');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showResult) {
        handleNext();
      } else {
        handleCheckAnswer();
      }
    }
  };

  const getDifficultyLabel = (d: string) => {
    switch (d) {
      case 'easy': return { text: 'Легко', color: 'bg-green-100 text-green-700' };
      case 'medium': return { text: 'Средне', color: 'bg-yellow-100 text-yellow-700' };
      case 'hard': return { text: 'Сложно', color: 'bg-red-100 text-red-700' };
      default: return { text: '', color: '' };
    }
  };

  const getCategoryInfo = (id: string) => categories.find((c) => c.id === id);

  // HOME SCREEN
  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        {/* Header */}
        <header className="pt-12 pb-8 text-center px-4">
          <div className="text-6xl mb-4 animate-bounce">📚</div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
            Задавальник
          </h1>
          <p className="mt-3 text-lg text-purple-200 max-w-md mx-auto">
            Интерактивный задачник для тренировки ума. Выберите категорию и решайте задачи!
          </p>
          {/* Stats bar */}
          {stats.total > 0 && (
            <div className="mt-6 inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
              <span className="text-green-400">✓ {stats.correct}</span>
              <span className="text-red-400">✗ {stats.wrong}</span>
              <span className="text-purple-200">Всего: {stats.total}</span>
            </div>
          )}
        </header>

        {/* Categories */}
        <main className="max-w-4xl mx-auto px-4 pb-12">
          <h2 className="text-xl font-semibold mb-6 text-center text-purple-200">
            Выберите категорию
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const catProblems = problems.filter((p) => p.category === cat.id);
              const catStat = categoryStats[cat.id];
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${cat.color} p-6 text-left shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="text-4xl mb-3">{cat.icon}</div>
                  <h3 className="text-xl font-bold">{cat.name}</h3>
                  <p className="text-sm text-white/70 mt-1">{catProblems.length} задач</p>
                  {catStat && catStat.total > 0 && (
                    <div className="mt-3 text-xs bg-white/20 rounded-full px-3 py-1 inline-block">
                      Решено: {catStat.correct}/{catStat.total}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Info section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold mb-1">25 задач</h3>
              <p className="text-sm text-purple-200">Разнообразные задачи по математике и логике</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="text-3xl mb-2">💡</div>
              <h3 className="font-semibold mb-1">Подсказки</h3>
              <p className="text-sm text-purple-200">Если застряли — используйте подсказку</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold mb-1">Прогресс</h3>
              <p className="text-sm text-purple-200">Отслеживайте свои результаты</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // CATEGORY SCREEN
  if (screen === 'category') {
    const catInfo = getCategoryInfo(selectedCategory);
    const catProblems = getCategoryProblems();
    const catStat = categoryStats[selectedCategory];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <header className="pt-8 pb-6 px-4">
          <button
            onClick={() => setScreen('home')}
            className="mb-6 flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
          >
            <span>←</span> Назад к категориям
          </button>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{catInfo?.icon}</span>
            <div>
              <h1 className="text-3xl font-bold">{catInfo?.name}</h1>
              <p className="text-purple-200">{catProblems.length} задач</p>
            </div>
          </div>
          {catStat && catStat.total > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${(catStat.correct / catProblems.length) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm text-purple-200">
                {catStat.correct}/{catProblems.length}
              </span>
            </div>
          )}
        </header>

        <main className="max-w-4xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catProblems.map((problem, idx) => {
              const diff = getDifficultyLabel(problem.difficulty);
              return (
                <button
                  key={problem.id}
                  onClick={() => {
                    setCurrentProblemIndex(idx);
                    setUserAnswer('');
                    setShowResult(false);
                    setShowHint(false);
                    setScreen('problem');
                  }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 text-left hover:bg-white/10 transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm text-purple-300">Задача {idx + 1}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${diff.color}`}>
                      {diff.text}
                    </span>
                  </div>
                  <p className="text-white/90 line-clamp-2">{problem.question}</p>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // RESULTS SCREEN
  if (screen === 'results') {
    const catInfo = getCategoryInfo(selectedCategory);
    const catStat = categoryStats[selectedCategory] || { correct: 0, wrong: 0, total: 0 };
    const catProblems = getCategoryProblems();
    const percentage = catProblems.length > 0 ? Math.round((catStat.correct / catProblems.length) * 100) : 0;

    let emoji = '😢';
    let message = 'Не расстраивайтесь! Попробуйте ещё раз.';
    if (percentage >= 80) { emoji = '🏆'; message = 'Отличный результат! Вы мастер!'; }
    else if (percentage >= 60) { emoji = '😊'; message = 'Хороший результат! Продолжайте!'; }
    else if (percentage >= 40) { emoji = '🤔'; message = 'Неплохо, но можно лучше!'; }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center px-4">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full text-center border border-white/20">
          <div className="text-7xl mb-4">{emoji}</div>
          <h2 className="text-2xl font-bold mb-2">Результаты</h2>
          <p className="text-purple-200 mb-6">{catInfo?.name}</p>

          <div className="bg-white/5 rounded-2xl p-6 mb-6">
            <div className="text-5xl font-bold mb-2">{percentage}%</div>
            <div className="flex justify-center gap-6 text-sm">
              <span className="text-green-400">✓ Верно: {catStat.correct}</span>
              <span className="text-red-400">✗ Неверно: {catStat.wrong}</span>
            </div>
          </div>

          <p className="text-purple-200 mb-8">{message}</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setCurrentProblemIndex(0);
                setUserAnswer('');
                setShowResult(false);
                setShowHint(false);
                setScreen('category');
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl py-3 px-6 font-semibold transition-all duration-200 hover:scale-105"
            >
              Попробовать снова
            </button>
            <button
              onClick={() => setScreen('home')}
              className="bg-white/10 hover:bg-white/20 rounded-xl py-3 px-6 font-semibold transition-all duration-200"
            >
              К категориям
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PROBLEM SCREEN
  if (!currentProblem) return null;
  const catInfo = getCategoryInfo(selectedCategory);
  const diff = getDifficultyLabel(currentProblem.difficulty);
  const isCorrect = userAnswer.trim().toLowerCase() === currentProblem.answer.toLowerCase();
  const catProblems = getCategoryProblems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Top bar */}
      <header className="pt-6 pb-4 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setScreen('category')}
            className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
          >
            <span>←</span> <span className="hidden sm:inline">Назад</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{catInfo?.icon}</span>
            <span className="text-sm text-purple-200">{catInfo?.name}</span>
          </div>
          <span className="text-sm text-purple-300">
            {currentProblemIndex + 1}/{catProblems.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-3">
          <div className="bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
              style={{ width: `${((currentProblemIndex + 1) / catProblems.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Problem card */}
      <main className="max-w-2xl mx-auto px-4 pb-12 pt-4">
        <div
          className={`bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/20 transition-all duration-300 ${
            animateCorrect ? 'ring-4 ring-green-400 scale-[1.02]' : ''
          } ${animateWrong ? 'ring-4 ring-red-400 animate-shake' : ''}`}
        >
          {/* Difficulty badge */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-purple-300">Задача {currentProblemIndex + 1}</span>
            <span className={`text-xs px-3 py-1 rounded-full ${diff.color}`}>{diff.text}</span>
          </div>

          {/* Question */}
          <h2 className="text-xl md:text-2xl font-semibold mb-6 leading-relaxed">
            {currentProblem.question}
          </h2>

          {/* Hint */}
          {showHint && currentProblem.hint && (
            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <span className="text-xl">💡</span>
                <p className="text-yellow-200 text-sm">{currentProblem.hint}</p>
              </div>
            </div>
          )}

          {/* Answer input */}
          {!showResult && (
            <div className="space-y-4">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите ответ..."
                className="w-full bg-white/5 border border-white/20 rounded-xl px-5 py-4 text-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCheckAnswer}
                  disabled={!userAnswer.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-3 px-6 font-semibold transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
                >
                  Проверить
                </button>
                {currentProblem.hint && (
                  <button
                    onClick={() => setShowHint(true)}
                    className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-xl py-3 px-5 transition-all duration-200"
                    title="Подсказка"
                  >
                    💡
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {showResult && (
            <div className="space-y-4">
              <div
                className={`rounded-xl p-5 ${
                  isCorrect
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>
                  <span className={`font-bold text-lg ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isCorrect ? 'Правильно!' : 'Неправильно'}
                  </span>
                </div>
                {!isCorrect && (
                  <p className="text-white/80">
                    Правильный ответ: <span className="font-bold text-green-400">{currentProblem.answer}</span>
                  </p>
                )}
              </div>

              {/* Explanation */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                <div className="flex items-start gap-2">
                  <span className="text-xl">📖</span>
                  <div>
                    <p className="text-sm text-blue-300 font-semibold mb-1">Решение:</p>
                    <p className="text-white/80 text-sm">{currentProblem.explanation}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNext}
                onKeyDown={handleKeyDown}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl py-3 px-6 font-semibold transition-all duration-200 hover:scale-[1.02]"
              >
                {currentProblemIndex < catProblems.length - 1 ? 'Следующая задача →' : 'Показать результаты'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
