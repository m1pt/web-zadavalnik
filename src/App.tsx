import { useState, useCallback, useEffect, useRef } from 'react';
import { problems, categories, Problem } from './data/problems';

type WindowId = 'home' | 'category' | 'problem' | 'results' | 'about' | 'help';

interface WindowState {
  id: WindowId;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  zIndex: number;
  data?: any;
}

interface Stats {
  correct: number;
  wrong: number;
  total: number;
}

function App() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<WindowId | null>(null);
  const [zCounter, setZCounter] = useState(100);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [selectedDesktopIcon, setSelectedDesktopIcon] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());
  const [dragState, setDragState] = useState<{ windowId: WindowId; offsetX: number; offsetY: number } | null>(null);

  // Problem state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [stats, setStats] = useState<Stats>({ correct: 0, wrong: 0, total: 0 });
  const [categoryStats, setCategoryStats] = useState<Record<string, Stats>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Focus input when problem opens
  useEffect(() => {
    if (activeWindowId === 'problem' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeWindowId, currentProblemIndex, showResult]);

  const bringToFront = useCallback((id: WindowId) => {
    const newZ = zCounter + 1;
    setZCounter(newZ);
    setWindows(w => w.map(win => win.id === id ? { ...win, zIndex: newZ, minimized: false } : win));
    setActiveWindowId(id);
  }, [zCounter]);

  const openWindow = useCallback((id: WindowId, title: string, icon: string, data?: any) => {
    const existing = windows.find(w => w.id === id);
    if (existing) {
      bringToFront(id);
      if (data) setWindows(w => w.map(win => win.id === id ? { ...win, data } : win));
      return;
    }

    const newZ = zCounter + 1;
    setZCounter(newZ);

    const offsetX = (windows.length % 5) * 25;
    const offsetY = (windows.length % 5) * 25;

    let width = 500;
    let height = 400;
    if (id === 'about') { width = 400; height = 300; }
    if (id === 'help') { width = 450; height = 350; }
    if (id === 'problem') { width = 520; height = 450; }

    const newWindow: WindowState = {
      id,
      title,
      icon,
      x: 80 + offsetX,
      y: 40 + offsetY,
      width,
      height,
      minimized: false,
      zIndex: newZ,
      data,
    };

    setWindows(w => [...w, newWindow]);
    setActiveWindowId(id);
  }, [windows, zCounter, bringToFront]);

  const closeWindow = useCallback((id: WindowId) => {
    setWindows(w => w.filter(win => win.id !== id));
    if (activeWindowId === id) {
      const remaining = windows.filter(w => w.id !== id);
      setActiveWindowId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  }, [activeWindowId, windows]);

  const minimizeWindow = useCallback((id: WindowId) => {
    setWindows(w => w.map(win => win.id === id ? { ...win, minimized: true } : win));
    const visible = windows.filter(w => !w.minimized && w.id !== id);
    setActiveWindowId(visible.length > 0 ? visible[visible.length - 1].id : null);
  }, [windows]);

  // Drag handling
  const handleMouseDown = (e: React.MouseEvent, windowId: WindowId) => {
    const win = windows.find(w => w.id === windowId);
    if (!win) return;
    bringToFront(windowId);
    setDragState({ windowId, offsetX: e.clientX - win.x, offsetY: e.clientY - win.y });
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: MouseEvent) => {
      setWindows(w => w.map(win =>
        win.id === dragState.windowId
          ? { ...win, x: Math.max(0, e.clientX - dragState.offsetX), y: Math.max(0, e.clientY - dragState.offsetY) }
          : win
      ));
    };

    const handleUp = () => setDragState(null);

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [dragState]);

  // Problem logic
  const getCategoryProblems = useCallback(
    () => problems.filter((p) => p.category === selectedCategory),
    [selectedCategory]
  );

  const currentProblem: Problem | undefined = getCategoryProblems()[currentProblemIndex];

  const openCategory = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    setSelectedCategory(categoryId);
    setCurrentProblemIndex(0);
    setUserAnswer('');
    setShowResult(false);
    setShowHint(false);
    openWindow('category', `${cat?.name} — Задавальник`, cat?.icon || '📁');
  };

  const openProblem = (idx: number) => {
    setCurrentProblemIndex(idx);
    setUserAnswer('');
    setShowResult(false);
    setShowHint(false);
    const cat = categories.find(c => c.id === selectedCategory);
    openWindow('problem', `Задача ${idx + 1} — ${cat?.name}`, '📝');
  };

  const handleCheckAnswer = () => {
    if (!currentProblem || !userAnswer.trim()) return;
    const isCorrect = userAnswer.trim().toLowerCase() === currentProblem.answer.toLowerCase();
    setShowResult(true);
    setShowHint(false);

    if (isCorrect) {
      setStats((s) => ({ ...s, correct: s.correct + 1, total: s.total + 1 }));
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
    const catProblems = getCategoryProblems();
    if (currentProblemIndex < catProblems.length - 1) {
      openProblem(currentProblemIndex + 1);
    } else {
      const cat = categories.find(c => c.id === selectedCategory);
      openWindow('results', 'Результаты', '📊');
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

  // Render window content
  const renderWindowContent = (win: WindowState) => {
    switch (win.id) {
      case 'category': {
        const catInfo = getCategoryInfo(selectedCategory);
        const catProblems = getCategoryProblems();
        const catStat = categoryStats[selectedCategory];
        return (
          <div className="flex flex-col h-full">
            {/* Menu bar */}
            <div className="flex gap-0 border-b border-[#808080] bg-[#c0c0c0] px-1">
              <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Файл</span>
              <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Вид</span>
              <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Справка</span>
            </div>
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-2 py-1 border-b border-[#808080]">
              <button className="win-btn" onClick={() => closeWindow('category')}>
                ← Назад
              </button>
              <div className="w-px h-5 bg-[#808080] mx-1"></div>
              <span className="text-[11px]">{catInfo?.icon} {catInfo?.name} — {catProblems.length} задач</span>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto p-3 bg-white m-[2px] win-border-inset">
              {catStat && catStat.total > 0 && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[11px]">Прогресс:</span>
                  <div className="win-progress flex-1 max-w-[200px]">
                    <div className="win-progress-fill" style={{ width: `${(catStat.correct / catProblems.length) * 100}%` }}></div>
                  </div>
                  <span className="text-[11px]">{catStat.correct}/{catProblems.length}</span>
                </div>
              )}
              <div className="grid grid-cols-1 gap-1">
                {catProblems.map((problem, idx) => (
                  <button
                    key={problem.id}
                    onClick={() => openProblem(idx)}
                    className="flex items-center gap-2 p-2 text-left hover:bg-[#000080] hover:text-white text-[11px] border border-transparent hover:border-[#000080]"
                  >
                    <span className="text-[14px]">📄</span>
                    <span className="flex-1 truncate">Задача {idx + 1}: {problem.question}</span>
                    <span className="text-[10px] opacity-70">{getDifficultyLabel(problem.difficulty)}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Status bar */}
            <div className="win-statusbar">
              <div className="win-statusbar-section">{catProblems.length} объектов</div>
            </div>
          </div>
        );
      }

      case 'problem': {
        if (!currentProblem) return <div className="p-4">Задача не найдена</div>;
        const diff = getDifficultyLabel(currentProblem.difficulty);
        const isCorrect = userAnswer.trim().toLowerCase() === currentProblem.answer.toLowerCase();
        const catProblems = getCategoryProblems();

        return (
          <div className="flex flex-col h-full">
            {/* Menu bar */}
            <div className="flex gap-0 border-b border-[#808080] bg-[#c0c0c0] px-1">
              <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Файл</span>
              <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => setShowHint(true)}>Подсказка</span>
              <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Справка</span>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {/* Progress */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[11px]">Задача {currentProblemIndex + 1} из {catProblems.length}</span>
                <div className="win-progress flex-1 max-w-[200px]">
                  <div className="win-progress-fill" style={{ width: `${((currentProblemIndex + 1) / catProblems.length) * 100}%` }}></div>
                </div>
                <span className="text-[11px]">{diff}</span>
              </div>

              {/* Question */}
              <div className="win-groupbox mb-4">
                <span className="win-groupbox-label">Условие задачи</span>
                <p className="text-[12px] leading-relaxed">{currentProblem.question}</p>
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
                    <label className="text-[11px]">Ответ:</label>
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
                      <span>{isCorrect ? '✅' : '❌'}</span>
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
                        <p className="text-[11px]">{currentProblem.explanation}</p>
                      </div>
                    </div>
                  </div>
                  <button className="win-btn" onClick={handleNext}>
                    {currentProblemIndex < catProblems.length - 1 ? 'Далее →' : 'Результаты'}
                  </button>
                </div>
              )}
            </div>
            {/* Status bar */}
            <div className="win-statusbar">
              <div className="win-statusbar-section">
                {stats.correct} верно | {stats.wrong} неверно
              </div>
            </div>
          </div>
        );
      }

      case 'results': {
        const catInfo = getCategoryInfo(selectedCategory);
        const catStat = categoryStats[selectedCategory] || { correct: 0, wrong: 0, total: 0 };
        const catProblems = getCategoryProblems();
        const percentage = catProblems.length > 0 ? Math.round((catStat.correct / catProblems.length) * 100) : 0;

        let emoji = '😢';
        let message = 'Не расстраивайтесь! Попробуйте ещё раз.';
        if (percentage >= 80) { emoji = '🏆'; message = 'Отличный результат! Вы мастер!'; }
        else if (percentage >= 60) { emoji = '😊'; message = 'Хороший результат!'; }
        else if (percentage >= 40) { emoji = '🤔'; message = 'Неплохо, но можно лучше!'; }

        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="text-5xl mb-4">{emoji}</div>
              <h2 className="text-[14px] font-bold mb-2">Результаты — {catInfo?.name}</h2>
              <div className="win-border-inset bg-white p-4 mb-4 w-full max-w-[250px]">
                <div className="text-[24px] font-bold mb-2">{percentage}%</div>
                <div className="win-progress mb-2">
                  <div className="win-progress-fill" style={{ width: `${percentage}%` }}></div>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-green-700">✓ Верно: {catStat.correct}</span>
                  <span className="text-red-700">✗ Неверно: {catStat.wrong}</span>
                </div>
              </div>
              <p className="text-[11px] mb-4">{message}</p>
              <div className="flex gap-2">
                <button className="win-btn" onClick={() => {
                  closeWindow('results');
                  setCurrentProblemIndex(0);
                  setUserAnswer('');
                  setShowResult(false);
                }}>
                  Заново
                </button>
                <button className="win-btn" onClick={() => closeWindow('results')}>
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        );
      }

      case 'about':
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="text-4xl mb-3">📚</div>
              <h2 className="text-[14px] font-bold mb-1">Задавальник</h2>
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
              <button className="win-btn" onClick={() => closeWindow('about')}>OK</button>
            </div>
          </div>
        );

      case 'help':
        return (
          <div className="flex flex-col h-full">
            <div className="flex gap-0 border-b border-[#808080] bg-[#c0c0c0] px-1">
              <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Содержание</span>
              <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Индекс</span>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-white m-[2px] win-border-inset">
              <h3 className="text-[12px] font-bold mb-2">📚 Как пользоваться Задавальником</h3>
              <div className="text-[11px] space-y-2">
                <p><b>1.</b> Дважды щёлкните на иконке категории на рабочем столе.</p>
                <p><b>2.</b> Выберите задачу из списка.</p>
                <p><b>3.</b> Введите ответ и нажмите «Проверить» или Enter.</p>
                <p><b>4.</b> Если затрудняетесь — нажмите «Подсказка» 💡</p>
                <p><b>5.</b> После ответа можно посмотреть решение.</p>
                <p><b>6.</b> Прогресс отображается в панели задач и в окне категории.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#c0c0c0]">
                <p className="text-[11px] text-[#808080]">© 2024 Задавальник. Все права защищены.</p>
              </div>
            </div>
            <div className="flex justify-end p-2 gap-2">
              <button className="win-btn" onClick={() => closeWindow('help')}>OK</button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{ background: '#008080' }}
      onClick={() => { setStartMenuOpen(false); setSelectedDesktopIcon(null); }}
      ref={desktopRef}
    >
      {/* Desktop icons */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 flex-wrap" style={{ maxHeight: 'calc(100vh - 50px)' }}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`win-desktop-icon ${selectedDesktopIcon === cat.id ? 'selected' : ''}`}
            onClick={(e) => { e.stopPropagation(); setSelectedDesktopIcon(cat.id); }}
            onDoubleClick={(e) => { e.stopPropagation(); openCategory(cat.id); }}
          >
            <div className="icon-img flex items-center justify-center text-[28px]">
              {cat.icon}
            </div>
            <span className="icon-label">{cat.name}</span>
          </div>
        ))}
        <div
          className={`win-desktop-icon ${selectedDesktopIcon === 'about' ? 'selected' : ''}`}
          onClick={(e) => { e.stopPropagation(); setSelectedDesktopIcon('about'); }}
          onDoubleClick={(e) => { e.stopPropagation(); openWindow('about', 'О программе', 'ℹ️'); }}
        >
          <div className="icon-img flex items-center justify-center text-[28px]">ℹ️</div>
          <span className="icon-label">О программе</span>
        </div>
        <div
          className={`win-desktop-icon ${selectedDesktopIcon === 'help' ? 'selected' : ''}`}
          onClick={(e) => { e.stopPropagation(); setSelectedDesktopIcon('help'); }}
          onDoubleClick={(e) => { e.stopPropagation(); openWindow('help', 'Справка', '❓'); }}
        >
          <div className="icon-img flex items-center justify-center text-[28px]">❓</div>
          <span className="icon-label">Справка</span>
        </div>
      </div>

      {/* Windows */}
      {windows.map((win) => {
        if (win.minimized) return null;
        const isActive = activeWindowId === win.id;
        return (
          <div
            key={win.id}
            className="win-window win-window-animate"
            style={{
              left: win.x,
              top: win.y,
              width: win.width,
              height: win.height,
              zIndex: win.zIndex,
            }}
            onClick={(e) => { e.stopPropagation(); bringToFront(win.id); }}
          >
            {/* Title bar */}
            <div
              className={`win-titlebar ${!isActive ? 'inactive' : ''}`}
              onMouseDown={(e) => handleMouseDown(e, win.id)}
            >
              <div className="flex items-center gap-1 overflow-hidden">
                <span className="text-[11px]">{win.icon}</span>
                <span className="truncate">{win.title}</span>
              </div>
              <div className="flex gap-[2px]">
                <button
                  className="win-titlebar-btn"
                  onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
                  title="Свернуть"
                >
                  <span className="mt-[2px]">_</span>
                </button>
                <button
                  className="win-titlebar-btn"
                  onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                  title="Закрыть"
                >
                  ✕
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-hidden" style={{ height: 'calc(100% - 20px)' }}>
              {renderWindowContent(win)}
            </div>
          </div>
        );
      })}

      {/* Start menu */}
      {startMenuOpen && (
        <div
          className="win-menu"
          style={{ bottom: 30, left: 2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex">
            {/* Side banner */}
            <div className="w-[24px] bg-gradient-to-b from-[#000080] to-[#1084d0] flex items-end justify-center pb-2">
              <span className="text-white text-[10px] font-bold writing-mode-vertical transform -rotate-0" style={{ writingMode: 'vertical-rl' }}>
                Задавальник98
              </span>
            </div>
            {/* Menu items */}
            <div className="flex-1 py-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="win-menu-item"
                  onClick={() => { setStartMenuOpen(false); openCategory(cat.id); }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>
              ))}
              <div className="win-menu-separator"></div>
              <div
                className="win-menu-item"
                onClick={() => { setStartMenuOpen(false); openWindow('help', 'Справка', '❓'); }}
              >
                <span>❓</span>
                <span>Справка</span>
              </div>
              <div
                className="win-menu-item"
                onClick={() => { setStartMenuOpen(false); openWindow('about', 'О программе', 'ℹ️'); }}
              >
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

        {/* Window buttons */}
        <div className="flex-1 flex items-center gap-1 overflow-hidden">
          {windows.map((win) => (
            <button
              key={win.id}
              className={`win-taskbar-item ${activeWindowId === win.id && !win.minimized ? 'active' : ''}`}
              onClick={() => {
                if (win.minimized || activeWindowId !== win.id) {
                  bringToFront(win.id);
                } else {
                  minimizeWindow(win.id);
                }
              }}
            >
              <span className="text-[11px]">{win.icon}</span>
              <span className="truncate">{win.title}</span>
            </button>
          ))}
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
