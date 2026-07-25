import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db/database'
import type { AppSettings } from '@/types'

const defaultSettings: AppSettings = {
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
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({ ...defaultSettings })
  let systemThemeListener: (() => void) | null = null

  async function load() {
    const s = await db.settings.get('default')
    if (s) settings.value = s
  }

  async function save(updates: Partial<AppSettings>) {
    Object.assign(settings.value, updates)
    await db.settings.put(settings.value)
    applyTheme()
    applyFontSize()
  }

  function applyTheme() {
    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')

    // Clean up previous listener
    if (systemThemeListener) {
      prefersDark.removeEventListener('change', systemThemeListener)
      systemThemeListener = null
    }

    if (settings.value.theme === 'dark') {
      root.classList.add('dark')
    } else if (settings.value.theme === 'light') {
      root.classList.remove('dark')
    } else {
      root.classList.toggle('dark', prefersDark.matches)
      // Listen for system theme changes
      systemThemeListener = () => {
        root.classList.toggle('dark', prefersDark.matches)
      }
      prefersDark.addEventListener('change', systemThemeListener)
    }
  }

  function applyFontSize() {
    const root = document.documentElement
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large')
    root.classList.add(`font-size-${settings.value.fontSize}`)
  }

  return { settings, load, save, applyTheme, applyFontSize }
})