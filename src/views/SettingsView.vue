<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useTaskStore } from '@/stores/taskStore'
import { db } from '@/db/database'
import { Moon, Sun, Monitor, Download, Upload, Trash2, Bell, BellOff, Clock, Languages, LayoutGrid } from 'lucide-vue-next'

const settingsStore = useSettingsStore()
const taskStore = useTaskStore()

const message = ref('')

async function changeTheme(theme: 'light' | 'dark' | 'system') {
  await settingsStore.save({ theme })
}

async function changeFontSize(size: 'small' | 'medium' | 'large') {
  await settingsStore.save({ fontSize: size })
}

async function changeTimeFormat(format: '12h' | '24h') {
  await settingsStore.save({ timeFormat: format })
}

async function changeWeekStart(day: 0 | 1) {
  await settingsStore.save({ weekStartsOn: day })
}

async function changeLanguage(lang: 'zh-CN' | 'en-US') {
  await settingsStore.save({ language: lang })
}

async function changeReminderMinutes(minutes: number) {
  await settingsStore.save({ defaultReminderMinutes: minutes })
}

async function toggleNotificationSound() {
  await settingsStore.save({ notificationSound: !settingsStore.settings.notificationSound })
}

async function togglePersistentReminder() {
  await settingsStore.save({ persistentReminder: !settingsStore.settings.persistentReminder })
}

async function changeCalendarDensity(density: 'compact' | 'comfortable') {
  await settingsStore.save({ calendarDensity: density })
}

async function exportData() {
  const data = {
    tasks: await db.tasks.toArray(),
    lists: await db.lists.toArray(),
    tags: await db.tags.toArray(),
    filters: await db.filters.toArray(),
    habits: await db.habits.toArray(),
    habitRecords: await db.habitRecords.toArray(),
    pomodoroRecords: await db.pomodoroRecords.toArray(),
    countdowns: await db.countdowns.toArray(),
    settings: settingsStore.settings
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dida-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function importData() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const text = await file.text()
    const data = JSON.parse(text)
    if (data.tasks) await db.tasks.bulkPut(data.tasks)
    if (data.lists) await db.lists.bulkPut(data.lists)
    if (data.tags) await db.tags.bulkPut(data.tags)
    if (data.filters) await db.filters.bulkPut(data.filters)
    if (data.habits) await db.habits.bulkPut(data.habits)
    if (data.habitRecords) await db.habitRecords.bulkPut(data.habitRecords)
    if (data.pomodoroRecords) await db.pomodoroRecords.bulkPut(data.pomodoroRecords)
    if (data.countdowns) await db.countdowns.bulkPut(data.countdowns)
    await Promise.all([
      taskStore.loadTasks(), taskStore.loadLists(), taskStore.loadTags(),
      taskStore.loadFilters(), taskStore.loadFolders()
    ])
    message.value = '数据导入成功！'
    setTimeout(() => { message.value = '' }, 3000)
  }
  input.click()
}

async function clearAllData() {
  if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) return
  await db.tasks.clear()
  await db.lists.clear()
  await db.tags.clear()
  await db.filters.clear()
  await db.habits.clear()
  await db.habitRecords.clear()
  await db.pomodoroRecords.clear()
  await db.countdowns.clear()
  await db.reminders.clear()
  await Promise.all([
    taskStore.loadTasks(), taskStore.loadLists(), taskStore.loadTags(),
    taskStore.loadFilters(), taskStore.loadFolders()
  ])
  message.value = '所有数据已清除'
  setTimeout(() => { message.value = '' }, 3000)
}
</script>

<template>
  <div class="h-full overflow-y-auto bg-white dark:bg-[var(--bg-card)] p-4">
    <h2 class="text-lg font-semibold mb-4">设置</h2>

    <div v-if="message" class="mb-4 px-4 py-2 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm rounded-btn animate-slide-down">
      {{ message }}
    </div>

    <!-- Theme -->
    <div class="card p-4 mb-4">
      <h3 class="text-sm font-medium mb-3">外观主题</h3>
      <div class="flex gap-2">
        <button
          class="flex-1 flex flex-col items-center gap-1 p-3 rounded-btn border transition-colors"
          :class="settingsStore.settings.theme === 'light' ? 'border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-[var(--border)]'"
          @click="changeTheme('light')"
        >
          <Sun :size="20" />
          <span class="text-xs">浅色</span>
        </button>
        <button
          class="flex-1 flex flex-col items-center gap-1 p-3 rounded-btn border transition-colors"
          :class="settingsStore.settings.theme === 'dark' ? 'border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-[var(--border)]'"
          @click="changeTheme('dark')"
        >
          <Moon :size="20" />
          <span class="text-xs">深色</span>
        </button>
        <button
          class="flex-1 flex flex-col items-center gap-1 p-3 rounded-btn border transition-colors"
          :class="settingsStore.settings.theme === 'system' ? 'border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-[var(--border)]'"
          @click="changeTheme('system')"
        >
          <Monitor :size="20" />
          <span class="text-xs">跟随系统</span>
        </button>
      </div>
    </div>

    <!-- Font Size -->
    <div class="card p-4 mb-4">
      <h3 class="text-sm font-medium mb-3">字体大小</h3>
      <div class="flex gap-2">
        <button
          v-for="size in [{k:'small' as const,l:'小'},{k:'medium' as const,l:'中'},{k:'large' as const,l:'大'}]"
          :key="size.k"
          class="flex-1 p-2 rounded-btn border text-sm transition-colors"
          :class="settingsStore.settings.fontSize === size.k ? 'border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-[var(--border)]'"
          @click="changeFontSize(size.k)"
        >
          {{ size.l }}
        </button>
      </div>
    </div>

    <!-- Time Format -->
    <div class="card p-4 mb-4">
      <h3 class="text-sm font-medium mb-3">时间格式</h3>
      <div class="flex gap-2">
        <button
          class="flex-1 p-2 rounded-btn border text-sm transition-colors"
          :class="settingsStore.settings.timeFormat === '24h' ? 'border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-[var(--border)]'"
          @click="changeTimeFormat('24h')"
        >24小时制</button>
        <button
          class="flex-1 p-2 rounded-btn border text-sm transition-colors"
          :class="settingsStore.settings.timeFormat === '12h' ? 'border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-[var(--border)]'"
          @click="changeTimeFormat('12h')"
        >12小时制</button>
      </div>
    </div>

    <!-- Week Start -->
    <div class="card p-4 mb-4">
      <h3 class="text-sm font-medium mb-3">一周起始日</h3>
      <div class="flex gap-2">
        <button
          class="flex-1 p-2 rounded-btn border text-sm transition-colors"
          :class="settingsStore.settings.weekStartsOn === 1 ? 'border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-[var(--border)]'"
          @click="changeWeekStart(1)"
        >周一</button>
        <button
          class="flex-1 p-2 rounded-btn border text-sm transition-colors"
          :class="settingsStore.settings.weekStartsOn === 0 ? 'border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-[var(--border)]'"
          @click="changeWeekStart(0)"
        >周日</button>
      </div>
    </div>

    <!-- Language -->
    <div class="card p-4 mb-4">
      <h3 class="text-sm font-medium mb-3 flex items-center gap-2">
        <Languages :size="16" class="text-[var(--text-secondary)]" />
        语言
      </h3>
      <div class="flex gap-2">
        <button
          class="flex-1 p-2 rounded-btn border text-sm transition-colors"
          :class="settingsStore.settings.language === 'zh-CN' ? 'border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-[var(--border)]'"
          @click="changeLanguage('zh-CN')"
        >中文</button>
        <button
          class="flex-1 p-2 rounded-btn border text-sm transition-colors"
          :class="settingsStore.settings.language === 'en-US' ? 'border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-[var(--border)]'"
          @click="changeLanguage('en-US')"
        >English</button>
      </div>
    </div>

    <!-- Default Reminder -->
    <div class="card p-4 mb-4">
      <h3 class="text-sm font-medium mb-3 flex items-center gap-2">
        <Clock :size="16" class="text-[var(--text-secondary)]" />
        默认提醒时间
      </h3>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="m in [0, 5, 10, 15, 30, 60]"
          :key="m"
          class="px-3 py-1.5 rounded-btn border text-sm transition-colors"
          :class="settingsStore.settings.defaultReminderMinutes === m ? 'border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-[var(--border)]'"
          @click="changeReminderMinutes(m)"
        >{{ m === 0 ? '不提醒' : m + '分钟' }}</button>
      </div>
    </div>

    <!-- Notification Sound -->
    <div class="card p-4 mb-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium flex items-center gap-2">
          <Bell v-if="settingsStore.settings.notificationSound" :size="16" class="text-[var(--text-secondary)]" />
          <BellOff v-else :size="16" class="text-[var(--text-secondary)]" />
          提醒声音
        </h3>
        <button
          class="relative w-11 h-6 rounded-full transition-colors duration-200"
          :class="settingsStore.settings.notificationSound ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'"
          @click="toggleNotificationSound"
        >
          <span
            class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
            :class="settingsStore.settings.notificationSound ? 'translate-x-5' : 'translate-x-0'"
          />
        </button>
      </div>
    </div>

    <!-- Persistent Reminder -->
    <div class="card p-4 mb-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium">持续提醒</h3>
          <p class="text-xs text-[var(--text-secondary)] mt-0.5">开启后，未处理的任务会持续提醒</p>
        </div>
        <button
          class="relative w-11 h-6 rounded-full transition-colors duration-200"
          :class="settingsStore.settings.persistentReminder ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'"
          @click="togglePersistentReminder"
        >
          <span
            class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
            :class="settingsStore.settings.persistentReminder ? 'translate-x-5' : 'translate-x-0'"
          />
        </button>
      </div>
    </div>

    <!-- Calendar Density -->
    <div class="card p-4 mb-4">
      <h3 class="text-sm font-medium mb-3 flex items-center gap-2">
        <LayoutGrid :size="16" class="text-[var(--text-secondary)]" />
        日历密度
      </h3>
      <div class="flex gap-2">
        <button
          class="flex-1 p-2 rounded-btn border text-sm transition-colors"
          :class="settingsStore.settings.calendarDensity === 'comfortable' ? 'border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-[var(--border)]'"
          @click="changeCalendarDensity('comfortable')"
        >舒适</button>
        <button
          class="flex-1 p-2 rounded-btn border text-sm transition-colors"
          :class="settingsStore.settings.calendarDensity === 'compact' ? 'border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-[var(--border)]'"
          @click="changeCalendarDensity('compact')"
        >紧凑</button>
      </div>
    </div>

    <!-- Data Management -->
    <div class="card p-4 mb-4">
      <h3 class="text-sm font-medium mb-3">数据管理</h3>
      <div class="space-y-2">
        <button class="btn-secondary w-full text-sm" @click="exportData">
          <Download :size="14" /> 导出数据 (JSON)
        </button>
        <button class="btn-secondary w-full text-sm" @click="importData">
          <Upload :size="14" /> 导入数据 (JSON)
        </button>
        <button class="btn-danger w-full text-sm" @click="clearAllData">
          <Trash2 :size="14" /> 清除所有数据
        </button>
      </div>
    </div>
  </div>
</template>