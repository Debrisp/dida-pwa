import Dexie, { type Table } from 'dexie'
import type {
  Task, CheckItem, TaskAttachment, TaskActivity,
  TaskList, Folder, Tag, Filter, Habit, HabitRecord,
  PomodoroRecord, Countdown, Reminder, AppSettings
} from '@/types'

export class DidaDatabase extends Dexie {
  tasks!: Table<Task, string>
  checkItems!: Table<CheckItem, string>
  attachments!: Table<TaskAttachment, string>
  activities!: Table<TaskActivity, string>
  lists!: Table<TaskList, string>
  folders!: Table<Folder, string>
  tags!: Table<Tag, string>
  filters!: Table<Filter, string>
  habits!: Table<Habit, string>
  habitRecords!: Table<HabitRecord, string>
  pomodoroRecords!: Table<PomodoroRecord, string>
  countdowns!: Table<Countdown, string>
  reminders!: Table<Reminder, string>
  settings!: Table<AppSettings, string>

  constructor() {
    super('DidaCloneDB')
    this.version(2).stores({
      tasks: 'id, listId, isCompleted, priority, dueDate, createdAt, sortOrder',
      checkItems: 'id, taskId, sortOrder',
      attachments: 'id, taskId',
      activities: 'id, taskId, createdAt',
      lists: 'id, folderId, isArchived, sortOrder',
      folders: 'id, sortOrder',
      tags: 'id',
      filters: 'id',
      habits: 'id',
      habitRecords: 'id, habitId, date',
      pomodoroRecords: 'id, startTime',
      countdowns: 'id',
      reminders: 'id, taskId, habitId, isTriggered',
      settings: 'id'
    })

    this.on('ready', async () => {
      await this.initDefaultData()
    })
  }

  private async initDefaultData() {
    const listCount = await this.lists.count()
    if (listCount === 0) {
      await this.lists.bulkAdd([
        { id: 'inbox', name: 'Inbox', color: '#4772FA', background: '', folderId: null, isArchived: false, sortOrder: 0, createdAt: new Date().toISOString() },
        { id: 'work', name: '工作', color: '#EF4444', background: '', folderId: null, isArchived: false, sortOrder: 1, createdAt: new Date().toISOString() },
        { id: 'personal', name: '个人', color: '#22C55E', background: '', folderId: null, isArchived: false, sortOrder: 2, createdAt: new Date().toISOString() },
        { id: 'study', name: '学习', color: '#F59E0B', background: '', folderId: null, isArchived: false, sortOrder: 3, createdAt: new Date().toISOString() },
        { id: 'shopping', name: '购物清单', color: '#8B5CF6', background: '', folderId: null, isArchived: false, sortOrder: 4, createdAt: new Date().toISOString() }
      ])
    }

    const settingsCount = await this.settings.count()
    if (settingsCount === 0) {
      await this.settings.put({
        id: 'default',
        language: 'zh-CN',
        weekStartsOn: 1,
        timeFormat: '24h',
        timezone: 'Asia/Shanghai',
        defaultReminderMinutes: 15,
        notificationSound: true,
        persistentReminder: false,
        theme: 'light',
        fontSize: 'medium',
        calendarDensity: 'comfortable'
      })
    }
  }
}

export const db = new DidaDatabase()