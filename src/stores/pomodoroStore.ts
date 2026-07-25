import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuid } from 'uuid'
import { db } from '@/db/database'
import type { PomodoroRecord } from '@/types'

export const usePomodoroStore = defineStore('pomodoro', () => {
  const records = ref<PomodoroRecord[]>([])

  const isRunning = ref(false)
  const isPaused = ref(false)
  const timeLeft = ref(25 * 60)
  const totalDuration = ref(25 * 60)
  const currentType = ref<'focus' | 'shortBreak' | 'longBreak'>('focus')
  const currentTaskId = ref<string | null>(null)
  const currentTaskTitle = ref<string | null>(null)
  const completedCount = ref(0)
  const startTimestamp = ref<string | null>(null)

  const focusMinutes = ref(25)
  const shortBreakMinutes = ref(5)
  const longBreakMinutes = ref(15)
  const longBreakInterval = ref(4)

  let timerInterval: ReturnType<typeof setInterval> | null = null

  const progress = computed(() => {
    if (totalDuration.value === 0) return 0
    return 1 - timeLeft.value / totalDuration.value
  })

  const formattedTime = computed(() => {
    const m = Math.floor(timeLeft.value / 60)
    const s = timeLeft.value % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  async function loadRecords() {
    records.value = await db.pomodoroRecords.orderBy('startTime').reverse().toArray()
  }

  function startTimer(taskId: string | null = null, taskTitle: string | null = null) {
    if (isRunning.value) return
    currentTaskId.value = taskId
    currentTaskTitle.value = taskTitle
    isRunning.value = true
    isPaused.value = false
    startTimestamp.value = new Date().toISOString()

    if (currentType.value === 'focus') {
      totalDuration.value = focusMinutes.value * 60
    } else if (currentType.value === 'longBreak') {
      totalDuration.value = longBreakMinutes.value * 60
    } else {
      totalDuration.value = shortBreakMinutes.value * 60
    }
    timeLeft.value = totalDuration.value

    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        completeTimer()
      }
    }, 1000)
  }

  function pauseTimer() {
    isPaused.value = true
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function resumeTimer() {
    isPaused.value = false
    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        completeTimer()
      }
    }, 1000)
  }

  async function completeTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }

    const record: PomodoroRecord = {
      id: uuid(),
      taskId: currentTaskId.value,
      taskTitle: currentTaskTitle.value,
      startTime: startTimestamp.value || new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: totalDuration.value,
      type: currentType.value,
      isCompleted: true
    }
    await db.pomodoroRecords.put(record)
    await loadRecords()

    if (currentType.value === 'focus') {
      completedCount.value++
      if (completedCount.value % longBreakInterval.value === 0) {
        currentType.value = 'longBreak'
      } else {
        currentType.value = 'shortBreak'
      }
    } else {
      currentType.value = 'focus'
    }

    isRunning.value = false
    isPaused.value = false
    startTimestamp.value = null
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    isRunning.value = false
    isPaused.value = false
    startTimestamp.value = null
  }

  async function getTodayPomodoros(): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = records.value.filter(r => r.startTime.startsWith(today) && r.type === 'focus')
    return todayRecords.length
  }

  return {
    records, isRunning, isPaused, timeLeft, totalDuration,
    currentType, currentTaskId, currentTaskTitle,
    completedCount, focusMinutes, shortBreakMinutes, longBreakMinutes, longBreakInterval,
    progress, formattedTime,
    loadRecords, startTimer, pauseTimer, resumeTimer, stopTimer, getTodayPomodoros
  }
})