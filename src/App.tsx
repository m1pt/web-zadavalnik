import { useState, useEffect, useRef } from 'react';
import {
  Subject,
  Task,
  FileItem,
  loadSubjects,
  saveSubjects,
  generateId,
  formatFileSize,
  getFileIcon,
} from './data/store';

function App() {
  const [subjects, setSubjects] = useState<Subject[]>(() => loadSubjects());
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectShort, setNewSubjectShort] = useState('');
  const [newSubjectIcon, setNewSubjectIcon] = useState('📚');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskWeek, setNewTaskWeek] = useState(1);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1, 2, 3]));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save to localStorage on change
  useEffect(() => {
    saveSubjects(subjects);
  }, [subjects]);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  // Add subject
  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    const newSubject: Subject = {
      id: generateId(),
      name: newSubjectName.trim(),
      shortName: newSubjectShort.trim() || newSubjectName.trim().substring(0, 6),
      icon: newSubjectIcon || '📚',
      tasks: [],
      files: [],
    };
    setSubjects([...subjects, newSubject]);
    setSelectedSubjectId(newSubject.id);
    setShowAddSubject(false);
    setNewSubjectName('');
    setNewSubjectShort('');
    setNewSubjectIcon('📚');
  };

  // Delete subject
  const handleDeleteSubject = (id: string) => {
    if (!confirm('Удалить предмет?')) return;
    const newSubjects = subjects.filter(s => s.id !== id);
    setSubjects(newSubjects);
    if (selectedSubjectId === id) {
      setSelectedSubjectId(newSubjects[0]?.id || '');
    }
  };

  // Add task
  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !selectedSubject) return;
    const newTask: Task = {
      id: generateId(),
      title: newTaskTitle.trim(),
      week: newTaskWeek,
      done: false,
    };
    const updated = subjects.map(s =>
      s.id === selectedSubjectId ? { ...s, tasks: [...s.tasks, newTask] } : s
    );
    setSubjects(updated);
    setNewTaskTitle('');
    setShowAddTask(false);
    setExpandedWeeks(prev => new Set(prev).add(newTaskWeek));
  };

  // Toggle task
  const handleToggleTask = (taskId: string) => {
    const updated = subjects.map(s =>
      s.id === selectedSubjectId
        ? { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) }
        : s
    );
    setSubjects(updated);
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    const updated = subjects.map(s =>
      s.id === selectedSubjectId
        ? { ...s, tasks: s.tasks.filter(t => t.id !== taskId) }
        : s
    );
    setSubjects(updated);
  };

  // Upload file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedSubject) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newFile: FileItem = {
          id: generateId(),
          name: file.name,
          type: file.name.split('.').pop() || 'unknown',
          size: file.size,
          dataUrl: reader.result as string,
          addedAt: Date.now(),
        };
        setSubjects(prev => prev.map(s =>
          s.id === selectedSubjectId ? { ...s, files: [...s.files, newFile] } : s
        ));
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Open file
  const handleOpenFile = (file: FileItem) => {
    if (file.dataUrl) {
      const win = window.open();
      if (win) {
        if (file.type === 'pdf') {
          win.document.write(`<iframe src="${file.dataUrl}" style="width:100%;height:100%;border:none;"></iframe>`);
        } else if (file.type.startsWith('image')) {
          win.document.write(`<img src="${file.dataUrl}" style="max-width:100%;">`);
        } else {
          win.document.write(`<p>Файл: ${file.name}</p><p><a href="${file.dataUrl}" download="${file.name}">Скачать</a></p>`);
        }
      }
    } else {
      alert('Файл недоступен (демо-режим)');
    }
  };

  // Delete file
  const handleDeleteFile = (fileId: string) => {
    const updated = subjects.map(s =>
      s.id === selectedSubjectId
        ? { ...s, files: s.files.filter(f => f.id !== fileId) }
        : s
    );
    setSubjects(updated);
    setContextMenu(null);
  };

  // Toggle week
  const toggleWeek = (week: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  };

  // Group tasks by week
  const tasksByWeek = selectedSubject
    ? selectedSubject.tasks.reduce((acc, task) => {
        if (!acc[task.week]) acc[task.week] = [];
        acc[task.week].push(task);
        return acc;
      }, {} as Record<number, Task[]>)
    : {};

  const sortedWeeks = Object.keys(tasksByWeek).map(Number).sort((a, b) => a - b);

  // Stats
  const totalTasks = selectedSubject?.tasks.length || 0;
  const doneTasks = selectedSubject?.tasks.filter(t => t.done).length || 0;

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{ background: '#008080' }}
      onClick={() => setContextMenu(null)}
    >
      {/* Main area — 3 columns */}
      <div className="flex-1 flex overflow-hidden p-1 gap-1" style={{ minHeight: 0 }}>
        {/* LEFT: Задавальник */}
        <div className="win-window flex flex-col" style={{ width: 240, flexShrink: 0 }}>
          <div className="win-titlebar">
            <div className="flex items-center gap-1 overflow-hidden">
              <span className="text-[11px]">📚</span>
              <span className="truncate">Задавальник</span>
            </div>
            <div className="flex gap-[2px]">
              <button className="win-titlebar-btn"><span className="mt-[2px]">_</span></button>
              <button className="win-titlebar-btn">□</button>
            </div>
          </div>
          <div className="flex gap-0 border-b border-[#808080] bg-[#c0c0c0] px-1">
            <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Файл</span>
            <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => setShowAddSubject(true)}>
              ➕ Добавить
            </span>
          </div>
          <div className="flex-1 overflow-auto bg-white m-[2px] win-border-inset p-2">
            <div className="text-[11px] mb-2 font-bold">📂 Мои предметы:</div>
            {subjects.map(subj => {
              const isSelected = subj.id === selectedSubjectId;
              const total = subj.tasks.length;
              const done = subj.tasks.filter(t => t.done).length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div
                  key={subj.id}
                  className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer mb-1 ${
                    isSelected ? 'bg-[#000080] text-white' : 'hover:bg-[#000080]/10'
                  }`}
                  onClick={() => setSelectedSubjectId(subj.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (confirm(`Удалить "${subj.name}"?`)) handleDeleteSubject(subj.id);
                  }}
                >
                  <span className="text-[14px]">{subj.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] truncate font-semibold">{subj.shortName}</div>
                    <div className="text-[9px] truncate opacity-70">{subj.name}</div>
                    {total > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className={`flex-1 h-[6px] ${isSelected ? 'bg-white/30' : 'bg-[#c0c0c0]'} border border-[#808080]`}>
                          <div
                            className={`h-full ${isSelected ? 'bg-white' : 'bg-[#000080]'}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <span className={`text-[9px] ${isSelected ? 'text-white' : 'text-[#808080]'}`}>
                          {done}/{total}
                        </span>
                      </div>
                    )}
                  </div>
                  {done === total && total > 0 && <span>✅</span>}
                </div>
              );
            })}
            {subjects.length === 0 && (
              <div className="text-[11px] text-[#808080] text-center py-4">
                Нет предметов. Нажмите "➕ Добавить"
              </div>
            )}
          </div>
          <div className="win-statusbar">
            <div className="win-statusbar-section text-[10px]">
              {subjects.length} предметов
            </div>
          </div>
        </div>

        {/* CENTER: Задачи */}
        <div className="win-window flex-1 flex flex-col" style={{ minWidth: 0 }}>
          <div className="win-titlebar">
            <div className="flex items-center gap-1 overflow-hidden">
              <span className="text-[11px]">📝</span>
              <span className="truncate">
                {selectedSubject ? `Задачи — ${selectedSubject.shortName}` : 'Выберите предмет'}
              </span>
            </div>
            <div className="flex gap-[2px]">
              <button className="win-titlebar-btn"><span className="mt-[2px]">_</span></button>
              <button className="win-titlebar-btn">□</button>
              <button className="win-titlebar-btn">✕</button>
            </div>
          </div>
          <div className="flex gap-0 border-b border-[#808080] bg-[#c0c0c0] px-1">
            <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Файл</span>
            <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => setShowAddTask(true)}>
              ➕ Задача
            </span>
            <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Вид</span>
          </div>
          {/* Address bar */}
          <div className="flex items-center gap-1 px-2 py-1 border-b border-[#808080] bg-[#c0c0c0]">
            <span className="text-[11px]">📋</span>
            <div className="win-input flex-1 text-[11px] py-0.5">
              {selectedSubject ? `C:\\Задавальник\\${selectedSubject.shortName}\\Задачи` : 'Выберите предмет'}
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-auto bg-white m-[2px] win-border-inset p-3">
            {selectedSubject ? (
              <>
                {/* Stats */}
                <div className="mb-3 flex items-center gap-3 text-[11px]">
                  <span>Всего задач: <b>{totalTasks}</b></span>
                  <span>Выполнено: <b className="text-green-700">{doneTasks}</b></span>
                  <span>Осталось: <b className="text-red-700">{totalTasks - doneTasks}</b></span>
                  {totalTasks > 0 && (
                    <div className="flex-1 max-w-[150px]">
                      <div className="win-progress h-[10px]">
                        <div className="win-progress-fill" style={{ width: `${(doneTasks / totalTasks) * 100}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tasks by week */}
                {sortedWeeks.length > 0 ? (
                  sortedWeeks.map(week => {
                    const tasks = tasksByWeek[week];
                    const weekDone = tasks.filter(t => t.done).length;
                    const isExpanded = expandedWeeks.has(week);
                    return (
                      <div key={week} className="mb-3">
                        <div
                          className="flex items-center gap-2 cursor-pointer bg-[#c0c0c0] px-2 py-1 win-border-outset-thin"
                          onClick={() => toggleWeek(week)}
                        >
                          <span className="text-[11px]">{isExpanded ? '▼' : '▶'}</span>
                          <span className="text-[11px] font-bold">Неделя {week}</span>
                          <span className="text-[10px] text-[#808080]">
                            ({weekDone}/{tasks.length} выполнено)
                          </span>
                        </div>
                        {isExpanded && (
                          <div className="ml-4 mt-1">
                            {tasks.map(task => (
                              <div
                                key={task.id}
                                className="flex items-center gap-2 py-1 px-2 hover:bg-[#000080]/5"
                              >
                                <input
                                  type="checkbox"
                                  checked={task.done}
                                  onChange={() => handleToggleTask(task.id)}
                                  className="cursor-pointer"
                                />
                                <span className={`text-[11px] flex-1 ${task.done ? 'line-through text-[#808080]' : ''}`}>
                                  {task.title}
                                </span>
                                <button
                                  className="text-[10px] text-red-600 hover:text-red-800 px-1"
                                  onClick={() => handleDeleteTask(task.id)}
                                  title="Удалить"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-[11px] text-[#808080] text-center py-8">
                    Нет задач. Нажмите "➕ Задача" чтобы добавить.
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[12px] text-[#808080]">
                Выберите предмет слева
              </div>
            )}
          </div>
          <div className="win-statusbar">
            <div className="win-statusbar-section text-[10px]">
              {totalTasks} задач | {doneTasks} выполнено
            </div>
          </div>
        </div>

        {/* RIGHT: Файлы */}
        <div className="win-window flex flex-col" style={{ width: 280, flexShrink: 0 }}>
          <div className="win-titlebar">
            <div className="flex items-center gap-1 overflow-hidden">
              <span className="text-[11px]">{selectedSubject?.icon || '📁'}</span>
              <span className="truncate">
                {selectedSubject ? `Файлы — ${selectedSubject.shortName}` : 'Файлы'}
              </span>
            </div>
            <div className="flex gap-[2px]">
              <button className="win-titlebar-btn"><span className="mt-[2px]">_</span></button>
              <button className="win-titlebar-btn">□</button>
            </div>
          </div>
          <div className="flex gap-0 border-b border-[#808080] bg-[#c0c0c0] px-1">
            <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Файл</span>
            <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              ➕ Добавить
            </span>
            <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer">Вид</span>
          </div>
          {/* Address bar */}
          <div className="flex items-center gap-1 px-2 py-1 border-b border-[#808080] bg-[#c0c0c0]">
            <span className="text-[11px]">📁</span>
            <div className="win-input flex-1 text-[11px] py-0.5">
              {selectedSubject ? `C:\\Задавальник\\${selectedSubject.shortName}` : 'Выберите предмет'}
            </div>
          </div>
          {/* Files list */}
          <div className="flex-1 overflow-auto bg-white m-[2px] win-border-inset">
            {selectedSubject && selectedSubject.files.length > 0 ? (
              selectedSubject.files.map(file => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 px-2 py-1.5 cursor-pointer border-b border-[#e0e0e0] hover:bg-[#000080]/10"
                  onDoubleClick={() => handleOpenFile(file)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, fileId: file.id });
                  }}
                >
                  <span className="text-[20px] flex-shrink-0">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] truncate">{file.name}</div>
                    <div className="text-[10px] text-[#808080]">
                      {file.type.toUpperCase()} | {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[11px] text-[#808080] text-center py-8">
                {selectedSubject ? 'Нет файлов. Нажмите "➕ Добавить"' : 'Выберите предмет'}
              </div>
            )}
          </div>
          <div className="win-statusbar">
            <div className="win-statusbar-section text-[10px]">
              {selectedSubject?.files.length || 0} объектов
            </div>
            <div className="win-statusbar-section text-[10px]" style={{ flex: '0 0 auto', width: 100 }}>
              {selectedSubject ? formatFileSize(selectedSubject.files.reduce((sum, f) => sum + f.size, 0)) : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="win-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="win-menu-item" onClick={() => {
            const file = selectedSubject?.files.find(f => f.id === contextMenu.fileId);
            if (file) handleOpenFile(file);
            setContextMenu(null);
          }}>
            <span>📂</span>
            <span>Открыть</span>
          </div>
          <div className="win-menu-separator"></div>
          <div className="win-menu-item" onClick={() => handleDeleteFile(contextMenu.fileId)}>
            <span>🗑️</span>
            <span>Удалить</span>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Add Subject Dialog */}
      {showAddSubject && (
        <div className="fixed inset-0 flex items-center justify-center z-[99999]" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="win-window" style={{ width: 350 }}>
            <div className="win-titlebar">
              <div className="flex items-center gap-1">
                <span className="text-[11px]">➕</span>
                <span>Добавить предмет</span>
              </div>
              <button className="win-titlebar-btn" onClick={() => setShowAddSubject(false)}>✕</button>
            </div>
            <div className="p-4 bg-[#c0c0c0]">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] block mb-1">Название:</label>
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="win-input w-full"
                    placeholder="Математический анализ"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                  />
                </div>
                <div>
                  <label className="text-[11px] block mb-1">Краткое название:</label>
                  <input
                    type="text"
                    value={newSubjectShort}
                    onChange={(e) => setNewSubjectShort(e.target.value)}
                    className="win-input w-full"
                    placeholder="Матан"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                  />
                </div>
                <div>
                  <label className="text-[11px] block mb-1">Иконка (эмодзи):</label>
                  <input
                    type="text"
                    value={newSubjectIcon}
                    onChange={(e) => setNewSubjectIcon(e.target.value)}
                    className="win-input w-full"
                    placeholder="📚"
                    maxLength={2}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button className="win-btn" onClick={handleAddSubject}>OK</button>
                <button className="win-btn" onClick={() => setShowAddSubject(false)}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Dialog */}
      {showAddTask && (
        <div className="fixed inset-0 flex items-center justify-center z-[99999]" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="win-window" style={{ width: 380 }}>
            <div className="win-titlebar">
              <div className="flex items-center gap-1">
                <span className="text-[11px]">➕</span>
                <span>Добавить задачу</span>
              </div>
              <button className="win-titlebar-btn" onClick={() => setShowAddTask(false)}>✕</button>
            </div>
            <div className="p-4 bg-[#c0c0c0]">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] block mb-1">Название задачи:</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="win-input w-full"
                    placeholder="Прочитать главу 5"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                </div>
                <div>
                  <label className="text-[11px] block mb-1">Неделя:</label>
                  <input
                    type="number"
                    value={newTaskWeek}
                    onChange={(e) => setNewTaskWeek(parseInt(e.target.value) || 1)}
                    className="win-input w-20"
                    min={1}
                    max={52}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button className="win-btn" onClick={handleAddTask}>OK</button>
                <button className="win-btn" onClick={() => setShowAddTask(false)}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
