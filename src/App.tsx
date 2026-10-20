import { useState, useEffect, useRef } from 'react';
import {
  Subject,
  ListItem,
  FileItem,
  loadSubjects,
  saveSubjects,
  generateId,
  formatFileSize,
  getFileIcon,
  formatDate,
} from './data/store';

function App() {
  const [subjects, setSubjects] = useState<Subject[]>(() => loadSubjects());
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectShort, setNewSubjectShort] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemType, setNewItemType] = useState<'task' | 'deadline'>('task');
  const [newItemNumber, setNewItemNumber] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDate, setNewItemDate] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save to localStorage on change
  useEffect(() => {
    saveSubjects(subjects);
  }, [subjects]);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  // Add subject
  const handleAddSubject = () => {
    if (!newSubjectShort.trim()) return;
    const newSubject: Subject = {
      id: generateId(),
      shortName: newSubjectShort.trim(),
      items: [],
      files: [],
    };
    setSubjects([...subjects, newSubject]);
    setSelectedSubjectId(newSubject.id);
    setShowAddSubject(false);
    setNewSubjectShort('');
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

  // Add item (task or deadline)
  const handleAddItem = () => {
    if (!selectedSubject) return;
    
    let newItem: ListItem;
    if (newItemType === 'task') {
      if (!newItemNumber.trim() || !newItemTitle.trim()) return;
      newItem = {
        id: generateId(),
        type: 'task',
        number: newItemNumber.trim(),
        title: newItemTitle.trim(),
        done: false,
      };
    } else {
      if (!newItemTitle.trim() || !newItemDate) return;
      newItem = {
        id: generateId(),
        type: 'deadline',
        title: newItemTitle.trim(),
        date: newItemDate,
      };
    }

    const updated = subjects.map(s =>
      s.id === selectedSubjectId ? { ...s, items: [...s.items, newItem] } : s
    );
    setSubjects(updated);
    setShowAddItem(false);
    setNewItemNumber('');
    setNewItemTitle('');
    setNewItemDate('');
  };

  // Toggle task
  const handleToggleTask = (itemId: string) => {
    const updated = subjects.map(s =>
      s.id === selectedSubjectId
        ? {
            ...s,
            items: s.items.map(item =>
              item.id === itemId && item.type === 'task' ? { ...item, done: !item.done } : item
            ),
          }
        : s
    );
    setSubjects(updated);
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    const updated = subjects.map(s =>
      s.id === selectedSubjectId
        ? { ...s, items: s.items.filter(item => item.id !== itemId) }
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

  // Stats
  const totalTasks = selectedSubject?.items.filter(i => i.type === 'task').length || 0;
  const doneTasks = selectedSubject?.items.filter(i => i.type === 'task' && i.done).length || 0;

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{ background: '#008080' }}
      onClick={() => setContextMenu(null)}
    >
      {/* Main area — 3 columns */}
      <div className="flex-1 flex overflow-hidden p-1 gap-1" style={{ minHeight: 0 }}>
        {/* LEFT: Задавальник */}
        <div className="win-window flex flex-col" style={{ width: 180, flexShrink: 0 }}>
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
              ➕
            </span>
          </div>
          <div className="flex-1 overflow-auto bg-white m-[2px] win-border-inset p-2">
            {subjects.map(subj => {
              const isSelected = subj.id === selectedSubjectId;
              const total = subj.items.filter(i => i.type === 'task').length;
              const done = subj.items.filter(i => i.type === 'task' && i.done).length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div
                  key={subj.id}
                  className={`px-2 py-1.5 cursor-pointer mb-1 ${
                    isSelected ? 'bg-[#000080] text-white' : 'hover:bg-[#000080]/10'
                  }`}
                  onClick={() => setSelectedSubjectId(subj.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (confirm(`Удалить "${subj.shortName}"?`)) handleDeleteSubject(subj.id);
                  }}
                >
                  <div className="text-[11px] font-semibold">{subj.shortName}</div>
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
              );
            })}
            {subjects.length === 0 && (
              <div className="text-[11px] text-[#808080] text-center py-4">
                Нет предметов
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
                {selectedSubject ? `${selectedSubject.shortName}` : 'Выберите предмет'}
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
            <span className="px-2 py-0.5 text-[11px] hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => setShowAddItem(true)}>
              ➕
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
                  <span>Всего: <b>{totalTasks}</b></span>
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

                {/* Items list */}
                {selectedSubject.items.length > 0 ? (
                  <div className="space-y-1">
                    {selectedSubject.items.map(item => {
                      if (item.type === 'deadline') {
                        return (
                          <div key={item.id} className="flex items-center gap-2 py-2 px-2 bg-[#ffffcc] border border-[#cccc00] mt-3 first:mt-0">
                            <span className="text-[11px]">📅</span>
                            <span className="text-[11px] font-bold">{item.title}</span>
                            <span className="text-[11px] text-[#808080]">— {formatDate(item.date)}</span>
                            <button
                              className="ml-auto text-[10px] text-red-600 hover:text-red-800 px-1"
                              onClick={() => handleDeleteItem(item.id)}
                              title="Удалить"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      } else {
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-2 py-1 px-2 cursor-pointer ${
                              item.done ? 'bg-[#c0ffc0]' : 'hover:bg-[#000080]/5'
                            }`}
                            onClick={() => handleToggleTask(item.id)}
                          >
                            <span className={`text-[11px] font-mono w-[60px] ${item.done ? 'line-through text-[#808080]' : ''}`}>
                              {item.number}
                            </span>
                            <span className={`text-[11px] flex-1 ${item.done ? 'line-through text-[#808080]' : ''}`}>
                              {item.title}
                            </span>
                            {item.done && <span className="text-[11px]">✅</span>}
                            <button
                              className="text-[10px] text-red-600 hover:text-red-800 px-1"
                              onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                              title="Удалить"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      }
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] text-[#808080] text-center py-8">
                    Нет задач. Нажмите "➕" чтобы добавить.
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
              <span className="text-[11px]">📁</span>
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
              ➕
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
                {selectedSubject ? 'Нет файлов' : 'Выберите предмет'}
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
          <div className="win-window-floating" style={{ width: 300 }}>
            <div className="win-titlebar">
              <div className="flex items-center gap-1">
                <span className="text-[11px]">➕</span>
                <span>Добавить предмет</span>
              </div>
              <button className="win-titlebar-btn" onClick={() => setShowAddSubject(false)}>✕</button>
            </div>
            <div className="p-4 bg-[#c0c0c0]">
              <div>
                <label className="text-[11px] block mb-1">Краткое название:</label>
                <input
                  type="text"
                  value={newSubjectShort}
                  onChange={(e) => setNewSubjectShort(e.target.value)}
                  className="win-input w-full"
                  placeholder="Матан"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button className="win-btn" onClick={handleAddSubject}>OK</button>
                <button className="win-btn" onClick={() => setShowAddSubject(false)}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Dialog */}
      {showAddItem && (
        <div className="fixed inset-0 flex items-center justify-center z-[99999]" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="win-window-floating" style={{ width: 380 }}>
            <div className="win-titlebar">
              <div className="flex items-center gap-1">
                <span className="text-[11px]">➕</span>
                <span>Добавить {newItemType === 'task' ? 'задачу' : 'дедлайн'}</span>
              </div>
              <button className="win-titlebar-btn" onClick={() => setShowAddItem(false)}>✕</button>
            </div>
            <div className="p-4 bg-[#c0c0c0]">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    className={`win-btn flex-1 ${newItemType === 'task' ? 'font-bold' : ''}`}
                    onClick={() => setNewItemType('task')}
                  >
                    Задача
                  </button>
                  <button
                    className={`win-btn flex-1 ${newItemType === 'deadline' ? 'font-bold' : ''}`}
                    onClick={() => setNewItemType('deadline')}
                  >
                    Дедлайн
                  </button>
                </div>
                {newItemType === 'task' ? (
                  <>
                    <div>
                      <label className="text-[11px] block mb-1">Номер задачи:</label>
                      <input
                        type="text"
                        value={newItemNumber}
                        onChange={(e) => setNewItemNumber(e.target.value)}
                        className="win-input w-full"
                        placeholder="1.2.102"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-[11px] block mb-1">Описание:</label>
                      <input
                        type="text"
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        className="win-input w-full"
                        placeholder="Вычислить интеграл"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-[11px] block mb-1">Название:</label>
                      <input
                        type="text"
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        className="win-input w-full"
                        placeholder="Контрольная работа"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-[11px] block mb-1">Дата:</label>
                      <input
                        type="date"
                        value={newItemDate}
                        onChange={(e) => setNewItemDate(e.target.value)}
                        className="win-input w-full"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button className="win-btn" onClick={handleAddItem}>OK</button>
                <button className="win-btn" onClick={() => setShowAddItem(false)}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
