export interface Task {
  id: string;
  title: string;
  week: number;
  done: boolean;
  description?: string;
}

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
  name: string;
  shortName: string;
  icon: string;
  tasks: Task[];
  files: FileItem[];
}

const STORAGE_KEY = 'zadavalnik_data';

export function loadSubjects(): Subject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
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
      name: 'Математический анализ',
      shortName: 'Матан',
      icon: '📊',
      tasks: [
        { id: 'm1', title: 'Прочитать главу 3 (пределы)', week: 1, done: false },
        { id: 'm2', title: 'Решить №3.1-3.15', week: 1, done: false },
        { id: 'm3', title: 'Подготовиться к контрольной', week: 2, done: false },
      ],
      files: [
        { id: 'mf1', name: 'Учебник_Матанализ.pdf', type: 'pdf', size: 4520000, addedAt: Date.now() },
        { id: 'mf2', name: 'Конспект_лекции_1.pdf', type: 'pdf', size: 890000, addedAt: Date.now() },
        { id: 'mf3', name: 'Задачник_Глава3.pdf', type: 'pdf', size: 1200000, addedAt: Date.now() },
      ],
    },
    {
      id: 'alge',
      name: 'Алгебра и геометрия',
      shortName: 'АлгеМ',
      icon: '📐',
      tasks: [
        { id: 'a1', title: 'Матрицы: операции, определители', week: 1, done: false },
        { id: 'a2', title: 'Решить СЛАУ методом Гаусса', week: 1, done: false },
        { id: 'a3', title: 'Векторы в пространстве', week: 2, done: false },
      ],
      files: [
        { id: 'af1', name: 'Алгебра_учебник.pdf', type: 'pdf', size: 3800000, addedAt: Date.now() },
        { id: 'af2', name: 'Геометрия_конспект.pdf', type: 'pdf', size: 650000, addedAt: Date.now() },
      ],
    },
    {
      id: 'alktg',
      name: 'Алгоритмы и КД',
      shortName: 'АлКТГ',
      icon: '🖥️',
      tasks: [
        { id: 'al1', title: 'Реализовать сортировку слиянием', week: 1, done: false },
        { id: 'al2', title: 'Лабораторная: деревья', week: 2, done: false },
        { id: 'al3', title: 'Подготовить отчёт', week: 2, done: false },
      ],
      files: [
        { id: 'alf1', name: 'Алгоритмы_Кормен.pdf', type: 'pdf', size: 12500000, addedAt: Date.now() },
        { id: 'alf2', name: 'Лекция_1_Введение.pdf', type: 'pdf', size: 450000, addedAt: Date.now() },
        { id: 'alf3', name: 'Методичка_лабы.pdf', type: 'pdf', size: 780000, addedAt: Date.now() },
      ],
    },
    {
      id: 'obsos',
      name: 'Обществознание',
      shortName: 'Общесос',
      icon: '📖',
      tasks: [
        { id: 'o1', title: 'Прочитать §4-5 (право)', week: 1, done: false },
        { id: 'o2', title: 'Эссе на тему "Конституция"', week: 1, done: false },
        { id: 'o3', title: 'Подготовить презентацию', week: 2, done: false },
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
