export type Priority = 'high' | 'medium' | 'low' | 'none'

export type RepeatRule =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'weekdays'
  | 'custom'

export type ViewType = 'list' | 'kanban' | 'calendar' | 'timeline'
export type CalendarViewType = 'day' | 'multi-day' | 'week' | 'multi-week' | 'month' | 'year' | 'schedule'

export interface Task {
  id: string
  title: string
  description: string
  listId: string
  tagIds: string[]
  priority: Priority
  dueDate: string | null
  startDate: string | null
  repeatRule: RepeatRule
  repeatCustom: string | null
  isCompleted: boolean
  completedAt: string | null
  isImportant: boolean
  isUrgent: boolean
  estimatedPomodoros: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CheckItem {
  id: string
  taskId: string
  title: string
  isCompleted: boolean
  sortOrder: number
  reminderDate: string | null
  createdAt: string
}

export interface TaskAttachment {
  id: string
  taskId: string
  fileName: string
  fileSize: number
  fileType: string
  fileData: string
  createdAt: string
}

export interface TaskActivity {
  id: string
  taskId: string
  action: string
  detail: string
  createdAt: string
}

export interface TaskList {
  id: string
  name: string
  color: string
  background: string
  folderId: string | null
  isArchived: boolean
  sortOrder: number
  createdAt: string
}

export interface Folder {
  id: string
  name: string
  sortOrder: number
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Filter {
  id: string
  name: string
  conditions: FilterCondition[]
  logic: 'and' | 'or'
}

export interface FilterCondition {
  field: 'listId' | 'tagId' | 'priority' | 'dueDate' | 'isCompleted' | 'keyword'
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'between'
  value: string
}

export interface Habit {
  id: string
  name: string
  icon: string
  color: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  frequencyCount: number
  reminderTime: string | null
  createdAt: string
}

export interface HabitRecord {
  id: string
  habitId: string
  date: string
  isCompleted: boolean
}

export interface PomodoroRecord {
  id: string
  taskId: string | null
  taskTitle: string | null
  startTime: string
  endTime: string
  duration: number
  type: 'focus' | 'shortBreak' | 'longBreak'
  isCompleted: boolean
}

export interface Countdown {
  id: string
  title: string
  type: 'birthday' | 'anniversary' | 'exam' | 'event' | 'custom'
  targetDate: string
  color: string
  createdAt: string
}

export interface Reminder {
  id: string
  taskId: string | null
  habitId: string | null
  time: string
  isTriggered: boolean
  isPersistent: boolean
}

export interface AppSettings {
  language: string
  weekStartsOn: 0 | 1
  timeFormat: '12h' | '24h'
  timezone: string
  defaultReminderMinutes: number
  notificationSound: boolean
  persistentReminder: boolean
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  calendarDensity: 'compact' | 'comfortable'
}

export type { }