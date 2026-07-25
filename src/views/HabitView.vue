<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useHabitStore } from '@/stores/habitStore'
import { Plus, Flame, Check, Trash2 } from 'lucide-vue-next'
import { format, eachDayOfInterval, subDays, isSameDay, parseISO } from 'date-fns'

const habitStore = useHabitStore()
const showNewHabit = ref(false)
const newHabitName = ref('')

const today = format(new Date(), 'yyyy-MM-dd')
const last30Days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() })

async function addHabit() {
  const name = newHabitName.value.trim()
  if (!name) return
  await habitStore.addHabit(name)
  newHabitName.value = ''
  showNewHabit.value = false
}

async function handleToggle(habitId: string) {
  await habitStore.toggleRecord(habitId, today)
}

function isChecked(habitId: string, date: Date): boolean {
  const dateStr = format(date, 'yyyy-MM-dd')
  return habitStore.records.some(r => r.habitId === habitId && r.date === dateStr)
}

async function deleteHabit(id: string) {
  await habitStore.deleteHabit(id)
}
</script>

<template>
  <div class="h-full overflow-y-auto bg-white dark:bg-[var(--bg-card)] p-4">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold">习惯打卡</h2>
      <button class="btn-primary text-sm" @click="showNewHabit = true">
        <Plus :size="16" />
        新建习惯
      </button>
    </div>

    <div v-if="showNewHabit" class="card p-4 mb-4 animate-slide-down">
      <input
        v-model="newHabitName"
        type="text"
        class="input"
        placeholder="习惯名称..."
        autofocus
        @keydown.enter="addHabit"
        @keydown.escape="showNewHabit = false"
      />
      <div class="flex justify-end gap-2 mt-3">
        <button class="btn-secondary text-sm" @click="showNewHabit = false">取消</button>
        <button class="btn-primary text-sm" @click="addHabit">创建</button>
      </div>
    </div>

    <div v-if="habitStore.habits.length === 0" class="text-center py-16 text-[var(--text-secondary)]">
      <p class="text-sm">还没有习惯，点击上方按钮创建</p>
    </div>

    <div class="space-y-4">
      <div v-for="habit in habitStore.habits" :key="habit.id" class="card p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center" :style="{ backgroundColor: habit.color + '15', color: habit.color }">
              <span class="text-sm">{{ habit.name[0] }}</span>
            </div>
            <div>
              <div class="text-sm font-medium">{{ habit.name }}</div>
              <div class="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                <Flame :size="12" :class="habitStore.getStreak(habit.id) > 0 ? 'text-orange-500' : 'text-gray-400'" />
                <span>连续 {{ habitStore.getStreak(habit.id) }} 天</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="w-10 h-10 rounded-full flex items-center justify-center transition-all"
              :class="isChecked(habit.id, new Date()) ? 'bg-green-500 text-white scale-110' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-green-100'"
              @click="handleToggle(habit.id)"
            >
              <Check :size="20" />
            </button>
            <button class="btn-ghost p-1" @click="deleteHabit(habit.id)">
              <Trash2 :size="14" class="text-gray-400 hover:text-red-500" />
            </button>
          </div>
        </div>

        <!-- Mini Heatmap -->
        <div class="flex gap-1">
          <div
            v-for="day in last30Days"
            :key="day.toISOString()"
            class="w-3 h-3 rounded-sm transition-colors"
            :class="isChecked(habit.id, day) ? 'opacity-100' : 'opacity-20 bg-gray-300 dark:bg-gray-600'"
            :style="isChecked(habit.id, day) ? { backgroundColor: habit.color } : {}"
            :title="format(day, 'MM/dd')"
          />
        </div>
      </div>
    </div>
  </div>
</template>