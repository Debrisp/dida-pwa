import { defineStore } from 'pinia'
import { ref } from 'vue'
import { v4 as uuid } from 'uuid'
import { db } from '@/db/database'
import type { Countdown } from '@/types'

export const useCountdownStore = defineStore('countdown', () => {
  const countdowns = ref<Countdown[]>([])

  async function loadAll() {
    countdowns.value = await db.countdowns.toArray()
  }

  async function addCountdown(title: string, targetDate: string, type: Countdown['type'] = 'custom', color: string = '#4772FA'): Promise<Countdown> {
    const c: Countdown = { id: uuid(), title, type, targetDate, color, createdAt: new Date().toISOString() }
    await db.countdowns.put(c)
    await loadAll()
    return c
  }

  async function updateCountdown(id: string, updates: Partial<Countdown>) {
    const c = countdowns.value.find(x => x.id === id)
    if (!c) return
    await db.countdowns.put({ ...c, ...updates })
    await loadAll()
  }

  async function deleteCountdown(id: string) {
    await db.countdowns.delete(id)
    await loadAll()
  }

  return { countdowns, loadAll, addCountdown, updateCountdown, deleteCountdown }
})