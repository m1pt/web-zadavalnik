import { useState, useCallback, useEffect, useRef } from 'react';
import { problems, categories, Problem } from './data/problems';

interface Stats {
  correct: number;
  wrong: number;
  total: number;
}

interface WindowPos {
  x: number;
  y: number;
  width: number;
  height: number;
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
  const [activeWindow, setActiveWindow] = useState<'tracker' | 'task' | 'files'>('task');

  // Window positions
  const [trackerPos, setTrackerPos] = useState<WindowPos>({ x: 10, y: 10, width: 220, height: 420 });
  const [taskPos, setTaskPos] = useState<WindowPos>({ x: 250, y: 20, width: 520, height: 480 });
  const [filesPos, setFilesPos] = useState<WindowPos>({ x: 790, y: 10, width: 260, height: 420 });

  // Z-index management
  const [zTracker, setZTracker] = useState(1);
  const [zTask, setZTask] = useState(2);
  const [zFiles, setZFiles] = useState(3);

  // Drag state
  const [dragging, setDragging] = useState<{
    window: 'tracker' | 'task' | 'files' | 'about' | 'help';
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // About/Help positions
  const [aboutPos, setAboutPos] = useState({ x: 300, y: 150 });
  const [helpPos, setHelpPos] = useState({ x: 250, y: 100 });

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

  // Add dragging class to body
  useEffect(() => {
    if (dragging) {
      document.body.classList.add('dragging');
    } else {
      document.body.classList.remove('dragging');
    }
    return () => document.body.classList.remove('dragging');
  }, [dragging]);

  // Global mouse handlers for drag
  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragging.offsetX));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragging.offsetY));

      switch (dragging.window) {
        case 'tracker':
          setTrackerPos(p => ({ ...p, x: newX, y: newY }));
          break;
        case 'task':
          setTaskPos(p => ({ ...p, x: newX, y: newY }));
          break;
        case 'files':
          setFilesPos(p => ({ ...p, x: newX, y: newY }));
          break;
        case 'about':
          setAboutPos({ x: newX, y: newY });
          break;
        case 'help':
          setHelpPos({ x: newX, y: newY });
          break;
      }
    };

    const handleUp = () => setDragging(null);

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [dragging]);

  const bringToFront = (win: 'tracker' | 'task' | 'files') => {
    const maxZ = Math.max(zTracker, zTask, zFiles);
    setActiveWindow(win);
    if (win === 'tracker') setZTracker(maxZ + 1);
    else if (win === 'task') setZTask(maxZ + 1);
    else setZFiles(maxZ + 1);
  };

  const startDrag = (e: React.MouseEvent, win: 'tracker' | 'task' | 'files' | 'about' | 'help') => {
    let pos;
    if (win === 'tracker') pos = trackerPos;
    else if (win === 'task') pos = taskPos;
    else if (win === 'files') pos = filesPos;
    else if (win === 'about') pos = { x: aboutPos.x, y: aboutPos.y, width: 0, height: 0 };
    else pos = { x: helpPos.x, y: helpPos.y, width: 0, height: 0 };

    setDragging({
      window: win,
      offsetX: e.clientX - pos.x,
      offsetY: e.clientY - pos.y,
    });

    if (win === 'tracker' || win === 'task' || win === 'files') {
      bringToFront(win);
    }
  };

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
    bringToFront('task');
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

  // Total solved per category
  const getCategorySolved = (catId: string) => {
    return problems.filter(p => p.category === catId && solvedProblems.has(p.id)).length;
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{ background: '#008080' }}
      onClick={() => setStartMenuOpen(false)}
    >
      {/* ============ LEFT: ЗАДАВАЛЬНИК (tracker only) ============ */}
      <div
        className="win-window absolute flex flex-col"
        style={{ left: trackerPos.x, top: trackerPos.y, width: trackerPos.width, height: trackerPos.height, zIndex: zTracker }}
        onClick={(e) => { e.stopPropagation(); bringToFront('tracker'); }}
      >
        <div
          className={`win-titlebar ${activeWindow !== 'tracker' ? 'inactive' : ''} cursor-move`}
          onMouseDown={(e) => startDrag(e, 'tracker')}
        >
          <div className="flex items-center gap-1 overflow-hidden">
            <span className="text-[11px]">📚</span>
            <span className="truncate">Задавальник</span>
          </div>
          <div className="flex gap-[2px]">
            <button className="win-titlebar-btn" onMouseDown={(e) => e.stopPropagation()}><span className="mt-[2px]">_</span></button>
            <button className="win-titlebar-btn" onMouseDown={(e) => e.stopPropagation()}>□</button>
          </div>
        </div>
        {/* Menu bar */}
        <div className="flex gap-0 border-b border-[#808080] bg-[#c0c0c0] px-1">
          <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Файл</span>
          <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => setShowHelp(true)}>Справка</span>
        </div>
        {/* Content — just subjects with progress */}
        <div className="flex-1 overflow-auto bg-white m-[2px] win-border-inset p-2">
          <div className="text-[11px] mb-2 font-bold">📂 Мои предметы:</div>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const total = problems.filter(p => p.category === cat.id).length;
            const solved = getCategorySolved(cat.id);
            const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
            return (
              <div
                key={cat.id}
                className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer mb-1 ${
                  isSelected ? 'bg-[#000080] text-white' : 'hover:bg-[#000080]/10'
                }`}
                onClick={() => handleCategorySelect(cat.id)}
              >
                <span className="text-[14px]">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] truncate">{cat.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className={`flex-1 h-[8px] ${isSelected ? 'bg-white/30' : 'bg-[#c0c0c0]'} border border-[#808080]`}>
                      <div
                        className={`h-full ${isSelected ? 'bg-white' : 'bg-[#000080]'}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <span className={`text-[9px] ${isSelected ? 'text-white' : 'text-[#808080]'}`}>
                      {solved}/{total}
                    </span>
                  </div>
                </div>
                {solved === total && total > 0 && <span>✅</span>}
              </div>
            );
          })}
          <div className="mt-3 pt-2 border-t border-[#c0c0c0]">
            <div className="text-[10px] text-[#808080]">
              Всего решено: {solvedProblems.size} / {problems.length}
            </div>
            <div className="win-progress mt-1 h-[10px]">
              <div className="win-progress-fill" style={{ width: `${(solvedProblems.size / problems.length) * 100}%` }}></div>
            </div>
          </div>
        </div>
        <div className="win-statusbar">
          <div className="win-statusbar-section text-[10px]">
            {categories.length} предметов
          </div>
        </div>
      </div>

      {/* ============ CENTER: TASK ============ */}
      <div
        className="win-window absolute flex flex-col"
        style={{ left: taskPos.x, top: taskPos.y, width: taskPos.width, height: taskPos.height, zIndex: zTask }}
        onClick={(e) => { e.stopPropagation(); bringToFront('task'); }}
      >
        <div
          className={`win-titlebar ${activeWindow !== 'task' ? 'inactive' : ''} cursor-move`}
          onMouseDown={(e) => startDrag(e, 'task')}
        >
          <div className="flex items-center gap-1 overflow-hidden">
            <span className="text-[11px]">📝</span>
            <span className="truncate">
              {currentProblem ? `Задача ${currentProblemIndex + 1} — ${selectedCatInfo?.name}` : 'Выберите задачу'}
            </span>
          </div>
          <div className="flex gap-[2px]">
            <button className="win-titlebar-btn" onMouseDown={(e) => e.stopPropagation()}><span className="mt-[2px]">_</span></button>
            <button className="win-titlebar-btn" onMouseDown={(e) => e.stopPropagation()}>□</button>
            <button className="win-titlebar-btn" onMouseDown={(e) => e.stopPropagation()}>✕</button>
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
              <div className="win-groupbox mb-4">
                <span className="win-groupbox-label">Условие задачи</span>
                <p className="text-[12px] leading-relaxed mt-1">{currentProblem.question}</p>
              </div>

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
                    <button className="win-btn" onClick={handleCheckAnswer} disabled={!userAnswer.trim()}>
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
        <div className="win-statusbar">
          <div className="win-statusbar-section">
            {stats.correct} верно | {stats.wrong} неверно | Всего: {stats.total}
          </div>
        </div>
      </div>

      {/* ============ RIGHT: FILES ============ */}
      <div
        className="win-window absolute flex flex-col"
        style={{ left: filesPos.x, top: filesPos.y, width: filesPos.width, height: filesPos.height, zIndex: zFiles }}
        onClick={(e) => { e.stopPropagation(); bringToFront('files'); }}
      >
        <div
          className={`win-titlebar ${activeWindow !== 'files' ? 'inactive' : ''} cursor-move`}
          onMouseDown={(e) => startDrag(e, 'files')}
        >
          <div className="flex items-center gap-1 overflow-hidden">
            <span className="text-[11px]">{selectedCatInfo?.icon}</span>
            <span className="truncate">{selectedCatInfo?.name}</span>
          </div>
          <div className="flex gap-[2px]">
            <button className="win-titlebar-btn" onMouseDown={(e) => e.stopPropagation()}><span className="mt-[2px]">_</span></button>
            <button className="win-titlebar-btn" onMouseDown={(e) => e.stopPropagation()}>□</button>
          </div>
        </div>
        {/* Address bar */}
        <div className="flex items-center gap-1 px-2 py-1 border-b border-[#808080] bg-[#c0c0c0]">
          <span className="text-[11px] whitespace-nowrap">📁</span>
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
        <div className="win-statusbar">
          <div className="win-statusbar-section text-[10px]">
            {catProblems.length} объектов
          </div>
          <div className="win-statusbar-section text-[10px]" style={{ flex: '0 0 auto', width: 80 }}>
            {catProblems.filter(p => solvedProblems.has(p.id)).length > 0
              ? `${catProblems.filter(p => solvedProblems.has(p.id)).length} решено`
              : ''}
          </div>
        </div>
      </div>

      {/* ============ ABOUT DIALOG ============ */}
      {showAbout && (
        <div
          className="win-window absolute"
          style={{ left: aboutPos.x, top: aboutPos.y, width: 360, zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="win-titlebar cursor-move"
            onMouseDown={(e) => startDrag(e, 'about')}
          >
            <div className="flex items-center gap-1">
              <span className="text-[11px]">ℹ️</span>
              <span>О программе</span>
            </div>
            <button className="win-titlebar-btn" onClick={() => setShowAbout(false)}>✕</button>
          </div>
          <div className="flex flex-col items-center p-6 text-center bg-[#c0c0c0]">
            <div className="text-4xl mb-3">📚</div>
            <h2 className="text-[14px] font-bold mb-1">Задавальник 98</h2>
            <p className="text-[11px] mb-1">Версия 1.0</p>
            <p className="text-[11px] mb-4">Интерактивный задачник</p>
            <div className="win-border-inset bg-white p-3 w-full text-[11px] text-left mb-4">
              <p>25 задач по 5 предметам:</p>
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
      )}

      {/* ============ HELP DIALOG ============ */}
      {showHelp && (
        <div
          className="win-window absolute"
          style={{ left: helpPos.x, top: helpPos.y, width: 420, zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="win-titlebar cursor-move"
            onMouseDown={(e) => startDrag(e, 'help')}
          >
            <div className="flex items-center gap-1">
              <span className="text-[11px]">❓</span>
              <span>Справка</span>
            </div>
            <button className="win-titlebar-btn" onClick={() => setShowHelp(false)}>✕</button>
          </div>
          <div className="bg-[#c0c0c0] p-2">
            <div className="overflow-auto bg-white win-border-inset p-4" style={{ height: 240 }}>
              <h3 className="text-[12px] font-bold mb-2">📚 Как пользоваться Задавальником</h3>
              <div className="text-[11px] space-y-2">
                <p><b>1.</b> Слева — <b>Задавальник</b>. Здесь видны все предметы и прогресс по каждому.</p>
                <p><b>2.</b> Кликните на предмет — справа откроется список задач.</p>
                <p><b>3.</b> Выберите задачу — в центре появится её условие.</p>
                <p><b>4.</b> Введите ответ и нажмите «Проверить» или Enter.</p>
                <p><b>5.</b> Если затрудняетесь — нажмите «Подсказка» 💡</p>
                <p><b>6.</b> Все окна можно <b>перетаскивать</b> за заголовок.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#c0c0c0]">
                <p className="text-[11px] text-[#808080]">© 2024 Задавальник 98</p>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button className="win-btn" onClick={() => setShowHelp(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ START MENU ============ */}
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

      {/* ============ TASKBAR ============ */}
      <div className="win-taskbar" onClick={(e) => e.stopPropagation()}>
        <button
          className={`win-start-btn ${startMenuOpen ? 'active' : ''}`}
          onClick={() => setStartMenuOpen(!startMenuOpen)}
        >
          <span className="text-[14px]">🪟</span>
          <span>Пуск</span>
        </button>

        <div className="w-px h-6 bg-[#808080] mx-1"></div>

        <div className="flex-1 flex items-center gap-1 overflow-hidden px-1">
          <button
            className={`win-taskbar-item ${activeWindow === 'tracker' ? 'active' : ''}`}
            onClick={() => bringToFront('tracker')}
          >
            <span className="text-[11px]">📚</span>
            <span>Задавальник</span>
          </button>
          <button
            className={`win-taskbar-item ${activeWindow === 'task' ? 'active' : ''}`}
            onClick={() => bringToFront('task')}
          >
            <span className="text-[11px]">📝</span>
            <span className="truncate">Задача {currentProblemIndex + 1}</span>
          </button>
          <button
            className={`win-taskbar-item ${activeWindow === 'files' ? 'active' : ''}`}
            onClick={() => bringToFront('files')}
          >
            <span className="text-[11px]">{selectedCatInfo?.icon}</span>
            <span className="truncate">{selectedCatInfo?.name}</span>
          </button>
        </div>

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
