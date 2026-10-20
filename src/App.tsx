import { useState, useCallback, useEffect, useRef } from 'react';
import { problems, categories, Problem } from './data/problems';

interface Stats {
  correct: number;
  wrong: number;
  total: number;
}

function App() {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0].id);
  const [currentProblemIndex, setCurrentProblemIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [stats, setStats] = useState<Stats>({ correct: 0, wrong: 0, total: 0 });
  const [categoryStats, setCategoryStats] = useState<Record<string, Stats>>({});
  const [solvedProblems, setSolvedProblems] = useState<Set<number>>(new Set());
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Focus input when problem changes
  useEffect(() => {
    if (!showResult && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [currentProblemIndex, selectedCategory, showResult]);

  const getCategoryProblems = useCallback(
    () => problems.filter((p) => p.category === selectedCategory),
    [selectedCategory]
  );

  const currentProblem: Problem | undefined = getCategoryProblems()[currentProblemIndex];
  const catProblems = getCategoryProblems();

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentProblemIndex(0);
    setUserAnswer('');
    setShowResult(false);
    setShowHint(false);
  };

  const handleProblemSelect = (idx: number) => {
    setCurrentProblemIndex(idx);
    setUserAnswer('');
    setShowResult(false);
    setShowHint(false);
  };

  const handleCheckAnswer = () => {
    if (!currentProblem || !userAnswer.trim()) return;
    const isCorrect = userAnswer.trim().toLowerCase() === currentProblem.answer.toLowerCase();
    setShowResult(true);
    setShowHint(false);

    if (isCorrect) {
      setStats((s) => ({ ...s, correct: s.correct + 1, total: s.total + 1 }));
      setSolvedProblems((prev) => new Set(prev).add(currentProblem.id));
    } else {
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
    if (currentProblemIndex < catProblems.length - 1) {
      handleProblemSelect(currentProblemIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showResult) handleNext();
      else handleCheckAnswer();
    }
  };

  const getDifficultyLabel = (d: string) => {
    switch (d) {
      case 'easy': return '🟢 Легко';
      case 'medium': return '🟡 Средне';
      case 'hard': return '🔴 Сложно';
      default: return '';
    }
  };

  const getCategoryInfo = (id: string) => categories.find((c) => c.id === id);
  const selectedCatInfo = getCategoryInfo(selectedCategory);

  const isCorrect = showResult && userAnswer.trim().toLowerCase() === currentProblem?.answer.toLowerCase();

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{ background: '#008080' }}
      onClick={() => setStartMenuOpen(false)}
    >
      {/* Main area — 3 panels */}
      <div className="flex-1 flex overflow-hidden p-1 gap-1" style={{ minHeight: 0 }}>
        {/* LEFT PANEL — Subjects tree */}
        <div className="win-window flex flex-col" style={{ width: 200, flexShrink: 0 }}>
          <div className="win-titlebar">
            <div className="flex items-center gap-1 overflow-hidden">
              <span className="text-[11px]">📚</span>
              <span className="truncate">Предметы</span>
            </div>
            <div className="flex gap-[2px]">
              <button className="win-titlebar-btn" title="Свернуть"><span className="mt-[2px]">_</span></button>
              <button className="win-titlebar-btn" title="Развернуть">□</button>
            </div>
          </div>
          {/* Menu bar */}
          <div className="flex gap-0 border-b border-[#808080] bg-[#c0c0c0] px-1">
            <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Вид</span>
            <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Справка</span>
          </div>
          {/* Tree content */}
          <div className="flex-1 overflow-auto bg-white m-[2px] win-border-inset p-1">
            {/* Root */}
            <div className="flex items-center gap-1 px-1 py-0.5 text-[11px]">
              <span>📂</span>
              <b>Задавальник</b>
            </div>
            {/* Categories */}
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const catStat = categoryStats[cat.id];
              const catCount = problems.filter(p => p.category === cat.id).length;
              return (
                <div key={cat.id}>
                  <div
                    className={`flex items-center gap-1 px-1 py-0.5 text-[11px] cursor-pointer ml-3 ${
                      isSelected ? 'bg-[#000080] text-white' : 'hover:bg-[#000080]/10'
                    }`}
                    onClick={() => handleCategorySelect(cat.id)}
                  >
                    <span>📁</span>
                    <span className="flex-1">{cat.icon} {cat.name}</span>
                    {catStat && catStat.total > 0 && (
                      <span className={`text-[9px] ${isSelected ? 'text-white' : 'text-[#808080]'}`}>
                        {catStat.correct}/{catCount}
                      </span>
                    )}
                  </div>
                  {/* Sub-items when selected */}
                  {isSelected && (
                    <div className="ml-6">
                      {problems.filter(p => p.category === cat.id).map((p, idx) => (
                        <div
                          key={p.id}
                          className={`flex items-center gap-1 px-1 py-0.5 text-[11px] cursor-pointer ${
                            currentProblemIndex === idx ? 'bg-[#000080] text-white' : 'hover:bg-[#000080]/10'
                          }`}
                          onClick={() => handleProblemSelect(idx)}
                        >
                          <span>{solvedProblems.has(p.id) ? '✅' : '📄'}</span>
                          <span className="truncate">Задача {idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Status bar */}
          <div className="win-statusbar">
            <div className="win-statusbar-section text-[10px]">
              {categories.length} предметов
            </div>
          </div>
        </div>

        {/* CENTER PANEL — Problem */}
        <div className="win-window flex-1 flex flex-col" style={{ minWidth: 0 }}>
          <div className="win-titlebar">
            <div className="flex items-center gap-1 overflow-hidden">
              <span className="text-[11px]">📝</span>
              <span className="truncate">
                {currentProblem ? `Задача ${currentProblemIndex + 1} — ${selectedCatInfo?.name}` : 'Выберите задачу'}
              </span>
            </div>
            <div className="flex gap-[2px]">
              <button className="win-titlebar-btn" title="Свернуть"><span className="mt-[2px]">_</span></button>
              <button className="win-titlebar-btn" title="Развернуть">□</button>
              <button className="win-titlebar-btn" title="Закрыть">✕</button>
            </div>
          </div>
          {/* Menu bar */}
          <div className="flex gap-0 border-b border-[#808080] bg-[#c0c0c0] px-1">
            <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Файл</span>
            <span
              className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer"
              onClick={() => currentProblem?.hint && setShowHint(true)}
            >
              Подсказка
            </span>
            <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => setShowHelp(true)}>
              Справка
            </span>
          </div>
          {/* Toolbar */}
          <div className="flex items-center gap-1 px-2 py-1 border-b border-[#808080]">
            <button
              className="win-btn"
              onClick={() => currentProblemIndex > 0 && handleProblemSelect(currentProblemIndex - 1)}
              disabled={currentProblemIndex === 0}
              style={{ minWidth: 30 }}
            >
              ◀
            </button>
            <button
              className="win-btn"
              onClick={() => currentProblemIndex < catProblems.length - 1 && handleProblemSelect(currentProblemIndex + 1)}
              disabled={currentProblemIndex >= catProblems.length - 1}
              style={{ minWidth: 30 }}
            >
              ▶
            </button>
            <div className="w-px h-5 bg-[#808080] mx-1"></div>
            <span className="text-[11px]">
              {currentProblemIndex + 1} / {catProblems.length}
            </span>
            <div className="flex-1"></div>
            <span className="text-[11px]">{getDifficultyLabel(currentProblem?.difficulty || '')}</span>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-auto p-4 bg-[#c0c0c0]">
            {currentProblem ? (
              <>
                {/* Question */}
                <div className="win-groupbox mb-4">
                  <span className="win-groupbox-label">Условие задачи</span>
                  <p className="text-[12px] leading-relaxed mt-1">{currentProblem.question}</p>
                </div>

                {/* Hint */}
                {showHint && currentProblem.hint && (
                  <div className="win-border-inset bg-[#ffffcc] p-2 mb-4">
                    <div className="flex items-start gap-2">
                      <span>💡</span>
                      <p className="text-[11px]"><b>Подсказка:</b> {currentProblem.hint}</p>
                    </div>
                  </div>
                )}

                {!showResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] whitespace-nowrap">Ответ:</label>
                      <input
                        ref={inputRef}
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="win-input flex-1"
                        placeholder="Введите ответ..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="win-btn"
                        onClick={handleCheckAnswer}
                        disabled={!userAnswer.trim()}
                      >
                        ✓ Проверить
                      </button>
                      {currentProblem.hint && !showHint && (
                        <button className="win-btn" onClick={() => setShowHint(true)}>
                          💡 Подсказка
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`win-border-inset p-3 ${isCorrect ? 'bg-[#c0ffc0]' : 'bg-[#ffc0c0]'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[16px]">{isCorrect ? '✅' : '❌'}</span>
                        <b className="text-[12px]">{isCorrect ? 'Правильно!' : 'Неправильно'}</b>
                      </div>
                      {!isCorrect && (
                        <p className="text-[11px]">Правильный ответ: <b>{currentProblem.answer}</b></p>
                      )}
                    </div>
                    <div className="win-border-inset bg-[#c0e0ff] p-3">
                      <div className="flex items-start gap-2">
                        <span>📖</span>
                        <div>
                          <p className="text-[11px] font-bold mb-1">Решение:</p>
                          <p className="text-[11px] leading-relaxed">{currentProblem.explanation}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {currentProblemIndex < catProblems.length - 1 && (
                        <button className="win-btn" onClick={handleNext}>
                          Следующая задача →
                        </button>
                      )}
                      <button className="win-btn" onClick={() => {
                        setUserAnswer('');
                        setShowResult(false);
                        setShowHint(false);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}>
                        Попробовать снова
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[12px] text-[#808080]">
                Выберите задачу из списка справа
              </div>
            )}
          </div>
          {/* Status bar */}
          <div className="win-statusbar">
            <div className="win-statusbar-section">
              {stats.correct} верно | {stats.wrong} неверно | Всего: {stats.total}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Files list */}
        <div className="win-window flex flex-col" style={{ width: 220, flexShrink: 0 }}>
          <div className="win-titlebar">
            <div className="flex items-center gap-1 overflow-hidden">
              <span className="text-[11px]">{selectedCatInfo?.icon}</span>
              <span className="truncate">{selectedCatInfo?.name}</span>
            </div>
            <div className="flex gap-[2px]">
              <button className="win-titlebar-btn" title="Свернуть"><span className="mt-[2px]">_</span></button>
              <button className="win-titlebar-btn" title="Развернуть">□</button>
            </div>
          </div>
          {/* Address bar */}
          <div className="flex items-center gap-1 px-2 py-1 border-b border-[#808080] bg-[#c0c0c0]">
            <span className="text-[11px] whitespace-nowrap">Папка:</span>
            <div className="win-input flex-1 text-[11px] py-0.5">
              C:\Задавальник\{selectedCatInfo?.name}
            </div>
          </div>
          {/* Files list */}
          <div className="flex-1 overflow-auto bg-white m-[2px] win-border-inset">
            {catProblems.map((problem, idx) => {
              const isActive = currentProblemIndex === idx;
              const isSolved = solvedProblems.has(problem.id);
              return (
                <div
                  key={problem.id}
                  className={`flex items-center gap-2 px-2 py-1 cursor-pointer border-b border-[#e0e0e0] ${
                    isActive ? 'bg-[#000080] text-white' : 'hover:bg-[#000080]/10'
                  }`}
                  onClick={() => handleProblemSelect(idx)}
                  onDoubleClick={() => handleProblemSelect(idx)}
                >
                  <span className="text-[16px] flex-shrink-0">
                    {isSolved ? '📗' : '📄'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[11px] truncate ${isActive ? 'text-white' : 'text-black'}`}>
                      Задача {idx + 1}
                    </div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-white/70' : 'text-[#808080]'}`}>
                      {problem.question}
                    </div>
                  </div>
                  <span className={`text-[9px] flex-shrink-0 ${isActive ? 'text-white/70' : 'text-[#808080]'}`}>
                    {problem.difficulty === 'easy' ? '1 KB' : problem.difficulty === 'medium' ? '2 KB' : '3 KB'}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Status bar */}
          <div className="win-statusbar">
            <div className="win-statusbar-section text-[10px]">
              {catProblems.length} объектов
            </div>
            <div className="win-statusbar-section text-[10px]" style={{ flex: '0 0 auto', width: 80 }}>
              {solvedProblems.size > 0
                ? `${catProblems.filter(p => solvedProblems.has(p.id)).length} решено`
                : ''}
            </div>
          </div>
        </div>
      </div>

      {/* About dialog */}
      {showAbout && (
        <div className="fixed inset-0 flex items-center justify-center z-[99999]" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="win-window" style={{ width: 360 }}>
            <div className="win-titlebar">
              <div className="flex items-center gap-1">
                <span className="text-[11px]">ℹ️</span>
                <span>О программе</span>
              </div>
              <button className="win-titlebar-btn" onClick={() => setShowAbout(false)}>✕</button>
            </div>
            <div className="flex flex-col items-center p-6 text-center">
              <div className="text-4xl mb-3">📚</div>
              <h2 className="text-[14px] font-bold mb-1">Задавальник 98</h2>
              <p className="text-[11px] mb-1">Версия 1.0</p>
              <p className="text-[11px] mb-4">Интерактивный задачник</p>
              <div className="win-border-inset bg-white p-3 w-full text-[11px] text-left mb-4">
                <p>25 задач по 5 категориям:</p>
                <ul className="ml-4 mt-1">
                  <li>🔢 Арифметика</li>
                  <li>📐 Алгебра</li>
                  <li>🧠 Логика</li>
                  <li>📏 Геометрия</li>
                  <li>📝 Текстовые задачи</li>
                </ul>
              </div>
              <button className="win-btn" onClick={() => setShowAbout(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Help dialog */}
      {showHelp && (
        <div className="fixed inset-0 flex items-center justify-center z-[99999]" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="win-window" style={{ width: 420, height: 340 }}>
            <div className="win-titlebar">
              <div className="flex items-center gap-1">
                <span className="text-[11px]">❓</span>
                <span>Справка</span>
              </div>
              <button className="win-titlebar-btn" onClick={() => setShowHelp(false)}>✕</button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-white m-[2px] win-border-inset mx-2 my-2" style={{ height: 230 }}>
              <h3 className="text-[12px] font-bold mb-2">📚 Как пользоваться Задавальником</h3>
              <div className="text-[11px] space-y-2">
                <p><b>1.</b> Выберите предмет в левой панели (дерево).</p>
                <p><b>2.</b> Выберите задачу в правой панели (список файлов) или в дереве слева.</p>
                <p><b>3.</b> Введите ответ в центральной панели и нажмите «Проверить» или Enter.</p>
                <p><b>4.</b> Если затрудняетесь — нажмите «Подсказка» 💡</p>
                <p><b>5.</b> После ответа можно посмотреть решение.</p>
                <p><b>6.</b> Решённые задачи отмечаются ✅ в списке.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#c0c0c0]">
                <p className="text-[11px] text-[#808080]">© 2024 Задавальник 98</p>
              </div>
            </div>
            <div className="flex justify-end p-2 gap-2">
              <button className="win-btn" onClick={() => setShowHelp(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Start menu */}
      {startMenuOpen && (
        <div
          className="win-menu"
          style={{ bottom: 30, left: 2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex">
            <div className="w-[24px] bg-gradient-to-b from-[#000080] to-[#1084d0] flex items-end justify-center pb-2">
              <span className="text-white text-[10px] font-bold" style={{ writingMode: 'vertical-rl' }}>
                Задавальник98
              </span>
            </div>
            <div className="flex-1 py-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="win-menu-item"
                  onClick={() => { setStartMenuOpen(false); handleCategorySelect(cat.id); }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>
              ))}
              <div className="win-menu-separator"></div>
              <div className="win-menu-item" onClick={() => { setStartMenuOpen(false); setShowHelp(true); }}>
                <span>❓</span>
                <span>Справка</span>
              </div>
              <div className="win-menu-item" onClick={() => { setStartMenuOpen(false); setShowAbout(true); }}>
                <span>ℹ️</span>
                <span>О программе</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="win-taskbar" onClick={(e) => e.stopPropagation()}>
        <button
          className={`win-start-btn ${startMenuOpen ? 'active' : ''}`}
          onClick={() => setStartMenuOpen(!startMenuOpen)}
        >
          <span className="text-[14px]">🪟</span>
          <span>Пуск</span>
        </button>

        <div className="w-px h-6 bg-[#808080] mx-1"></div>

        {/* Active window indicators */}
        <div className="flex-1 flex items-center gap-1 overflow-hidden px-1">
          <div className="win-taskbar-item active">
            <span className="text-[11px]">📚</span>
            <span>Предметы</span>
          </div>
          <div className="win-taskbar-item active">
            <span className="text-[11px]">📝</span>
            <span className="truncate">Задача {currentProblemIndex + 1}</span>
          </div>
          <div className="win-taskbar-item active">
            <span className="text-[11px]">{selectedCatInfo?.icon}</span>
            <span className="truncate">{selectedCatInfo?.name}</span>
          </div>
        </div>

        {/* Clock */}
        <div className="win-clock">
          <span className="text-[11px]">
            {time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
