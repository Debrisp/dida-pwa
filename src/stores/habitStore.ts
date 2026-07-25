import { defineStore } from 'pinia'
import { ref } from 'vue'
import { v4 as uuid } from 'uuid'
import { db } from '@/db/database'
import type { Habit, HabitRecord } from '@/types'

export const useHabitStore = defineStore('habit', () => {
  const habits = ref<Habit[]>([])
  const records = ref<HabitRecord[]>([])

  async function loadAll() {
    habits.value = await db.habits.toArray()
    records.value = await db.habitRecords.toArray()
  }

  async function addHabit(name: string, icon: string = 'star', color: string = '#4772FA'): Promise<Habit> {
    const habit: Habit = {
      id: uuid(),
      name,
      icon,
      color,
      frequency: 'daily',
      frequencyCount: 1,
      reminderTime: null,
      createdAt: new Date().toISOString()
    }
    await db.habits.put(habit)
    await loadAll()
    return habit
  }

  async function updateHabit(id: string, updates: Partial<Habit>) {
    const habit = habits.value.find(h => h.id === id)
    if (!habit) return
    await db.habits.put({ ...habit, ...updates })
    await loadAll()
  }

  async function deleteHabit(id: string) {
    await db.habits.delete(id)
    await db.habitRecords.where('habitId').equals(id).delete()
    await loadAll()
  }

  async function toggleRecord(habitId: string, date: string) {
    const existing = records.value.find(r => r.habitId === habitId && r.date === date)
    if (existing) {
      await db.habitRecords.delete(existing.id)
    } else {
      await db.habitRecords.put({ id: uuid(), habitId, date, isCompleted: true })
    }
    await loadAll()
  }

  function getRecordsForHabit(habitId: string): HabitRecord[] {
    return records.value.filter(r => r.habitId === habitId)
  }

  function getStreak(habitId: string): number {
    const habitRecords = getRecordsForHabit(habitId).sort((a, b) => b.date.localeCompare(a.date))
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    const checkDate = new Date(today)
    for (const record of habitRecords) {
      const expected = checkDate.toISOString().split('T')[0]
      if (record.date === expected) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else if (record.date < expected) {
        break
      }
    }
    return streak
  }

  return {
    habits, records,
    loadAll, addHabit, updateHabit, deleteHabit,
    toggleRecord, getRecordsForHabit, getStreak
  }
})