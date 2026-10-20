export type ListItem =
  | { id: string; type: 'deadline'; title: string; date: string }
  | { id: string; type: 'task'; number: string; title: string; done: boolean };

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  addedAt: number;
}

export interface Subject {
  id: string;
  shortName: string;
  items: ListItem[];
  files: FileItem[];
}

const STORAGE_KEY = 'zadavalnik_data';

export function loadSubjects(): Subject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validate structure — if old format, reset
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        if (first && Array.isArray(first.items) && typeof first.shortName === 'string' && !('name' in first)) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load subjects', e);
  }
  return getDefaultSubjects();
}

export function saveSubjects(subjects: Subject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  } catch (e) {
    console.error('Failed to save subjects', e);
  }
}

export function getDefaultSubjects(): Subject[] {
  return [
    {
      id: 'matan',
      shortName: 'Матан',
      items: [
        { id: 'm1', type: 'deadline', title: 'Контрольная работа', date: '2024-10-07' },
        { id: 'm2', type: 'task', number: '1.2.101', title: 'Найти предел последовательности', done: false },
        { id: 'm3', type: 'task', number: '1.2.102', title: 'Вычислить интеграл', done: false },
        { id: 'm4', type: 'task', number: '1.2.103', title: 'Исследовать ряд на сходимость', done: false },
        { id: 'm5', type: 'deadline', title: 'Домашняя работа', date: '2024-10-14' },
        { id: 'm6', type: 'task', number: '2.1.45', title: 'Разложить в ряд Тейлора', done: false },
        { id: 'm7', type: 'task', number: '2.1.46', title: 'Найти сумму ряда', done: false },
      ],
      files: [
        { id: 'mf1', name: 'Учебник_Матанализ.pdf', type: 'pdf', size: 4520000, addedAt: Date.now() },
        { id: 'mf2', name: 'Конспект_лекции_1.pdf', type: 'pdf', size: 890000, addedAt: Date.now() },
        { id: 'mf3', name: 'Задачник_Глава3.pdf', type: 'pdf', size: 1200000, addedAt: Date.now() },
      ],
    },
    {
      id: 'alge',
      shortName: 'АлгеМ',
      items: [
        { id: 'a1', type: 'task', number: '1.1.12', title: 'Вычислить определитель 3x3', done: false },
        { id: 'a2', type: 'task', number: '1.1.13', title: 'Решить СЛАУ методом Крамера', done: false },
        { id: 'a3', type: 'deadline', title: 'Лабораторная работа', date: '2024-10-10' },
        { id: 'a4', type: 'task', number: '2.3.8', title: 'Найти собственные значения', done: false },
        { id: 'a5', type: 'task', number: '2.3.9', title: 'Привести к диагональному виду', done: false },
      ],
      files: [
        { id: 'af1', name: 'Алгебра_учебник.pdf', type: 'pdf', size: 3800000, addedAt: Date.now() },
        { id: 'af2', name: 'Геометрия_конспект.pdf', type: 'pdf', size: 650000, addedAt: Date.now() },
      ],
    },
    {
      id: 'alktg',
      shortName: 'АлКТГ',
      items: [
        { id: 'al1', type: 'deadline', title: 'Сдать лабораторную', date: '2024-10-08' },
        { id: 'al2', type: 'task', number: 'ЛР-1.1', title: 'Реализовать сортировку слиянием', done: false },
        { id: 'al3', type: 'task', number: 'ЛР-1.2', title: 'Написать тесты', done: false },
        { id: 'al4', type: 'deadline', title: 'Курсовая работа', date: '2024-11-15' },
        { id: 'al5', type: 'task', number: 'КР-1', title: 'Разработать алгоритм', done: false },
      ],
      files: [
        { id: 'alf1', name: 'Алгоритмы_Кормен.pdf', type: 'pdf', size: 12500000, addedAt: Date.now() },
        { id: 'alf2', name: 'Лекция_1_Введение.pdf', type: 'pdf', size: 450000, addedAt: Date.now() },
        { id: 'alf3', name: 'Методичка_лабы.pdf', type: 'pdf', size: 780000, addedAt: Date.now() },
      ],
    },
    {
      id: 'obsos',
      shortName: 'Общесос',
      items: [
        { id: 'o1', type: 'task', number: '§4.1', title: 'Прочитать параграф о праве', done: false },
        { id: 'o2', type: 'deadline', title: 'Эссе', date: '2024-10-12' },
        { id: 'o3', type: 'task', number: 'Э-1', title: 'Написать эссе "Конституция"', done: false },
        { id: 'o4', type: 'task', number: '§5.2', title: 'Подготовить презентацию', done: false },
      ],
      files: [
        { id: 'of1', name: 'Обществознание_учебник.pdf', type: 'pdf', size: 5600000, addedAt: Date.now() },
        { id: 'of2', name: 'Конституция_РФ.pdf', type: 'pdf', size: 320000, addedAt: Date.now() },
      ],
    },
  ];
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
}

export function getFileIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'pdf': return '📕';
    case 'doc': case 'docx': return '📘';
    case 'xls': case 'xlsx': return '📗';
    case 'ppt': case 'pptx': return '📙';
    case 'txt': return '📄';
    case 'jpg': case 'jpeg': case 'png': case 'gif': return '🖼️';
    case 'zip': case 'rar': return '📦';
    default: return '📄';
  }
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}
