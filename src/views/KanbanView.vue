<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { useHabitStore } from '@/stores/habitStore'
import { Plus, Star, CheckCircle2, Check, Flame, ChevronDown, ChevronRight } from 'lucide-vue-next'
import { format, isToday, isTomorrow, isSameDay, parseISO } from 'date-fns'
import TaskDetailModal from '@/components/TaskDetailModal.vue'

const taskStore = useTaskStore()
const habitStore = useHabitStore()

const groupBy = ref<'dueDate' | 'priority' | 'list'>('dueDate')
const detailTaskId = ref<string | null>(null)
const showHabits = ref(true)

const todayStr = format(new Date(), 'yyyy-MM-dd')

function isHabitCheckedToday(habitId: string): boolean {
  return habitStore.records.some(r => r.habitId === habitId && r.date === todayStr)
}

async function toggleHabit(habitId: string) {
  await habitStore.toggleRecord(habitId, todayStr)
}

const today = new Date()

const columns = computed(() => {
  if (groupBy.value === 'dueDate') {
    return [
      { id: 'today', label: '今天', tasks: taskStore.tasks.filter(t => {
        const dueToday = t.dueDate && isToday(parseISO(t.dueDate))
        const completedToday = t.completedAt && isToday(parseISO(t.completedAt))
        return dueToday || completedToday
      }) },
      { id: 'tomorrow', label: '明天', tasks: taskStore.tasks.filter(t => t.dueDate && isTomorrow(parseISO(t.dueDate))) },
      { id: 'week', label: '本周', tasks: taskStore.tasks.filter(t => t.dueDate && !isToday(parseISO(t.dueDate)) && !isTomorrow(parseISO(t.dueDate)) && !t.completedAt) },
      { id: 'later', label: '以后', tasks: taskStore.tasks.filter(t => !t.dueDate && !t.completedAt) }
    ]
  } else if (groupBy.value === 'priority') {
    return [
      { id: 'high', label: '高优先级', tasks: taskStore.tasks.filter(t => t.priority === 'high') },
      { id: 'medium', label: '中优先级', tasks: taskStore.tasks.filter(t => t.priority === 'medium') },
      { id: 'low', label: '低优先级', tasks: taskStore.tasks.filter(t => t.priority === 'low') },
      { id: 'none', label: '无优先级', tasks: taskStore.tasks.filter(t => t.priority === 'none') }
    ]
  } else {
    return taskStore.lists.filter(l => !l.isArchived).map(l => ({
      id: l.id,
      label: l.name,
      color: l.color,
      tasks: taskStore.tasks.filter(t => t.listId === l.id)
    }))
  }
})

const priorityLabels: Record<string, string> = {
  high: '高', medium: '中', low: '低', none: ''
}

const priorityColors: Record<string, string> = {
  high: 'text-red-500 bg-red-50 dark:bg-red-500/10',
  medium: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10',
  low: 'text-green-500 bg-green-50 dark:bg-green-500/10',
  none: ''
}

async function handleToggle(id: string) {
  await taskStore.toggleTask(id)
}

async function addTask(listId: string) {
  const task = await taskStore.addTask('新任务', listId)
  detailTaskId.value = task.id
}

function openDetail(id: string) {
  detailTaskId.value = id
}
</script>

<template>
  <div class="h-full flex flex-col bg-[var(--bg)]">
    <div class="flex items-center justify-between px-4 py-3 bg-white dark:bg-[var(--bg-card)] border-b border-[var(--border)] shrink-0">
      <h2 class="text-lg font-semibold">看板</h2>
      <div class="flex gap-1">
        <button class="btn text-sm" :class="groupBy === 'dueDate' ? 'btn-primary' : 'btn-secondary'" @click="groupBy = 'dueDate'">按日期</button>
        <button class="btn text-sm" :class="groupBy === 'priority' ? 'btn-primary' : 'btn-secondary'" @click="groupBy = 'priority'">按优先级</button>
        <button class="btn text-sm" :class="groupBy === 'list' ? 'btn-primary' : 'btn-secondary'" @click="groupBy = 'list'">按清单</button>
      </div>
    </div>

    <div class="flex-1 flex gap-3 overflow-x-auto p-4">
      <div
        v-for="col in columns"
        :key="col.id"
        class="flex-shrink-0 w-64 flex flex-col bg-white dark:bg-[var(--bg-card)] rounded-card border border-[var(--border)]"
      >
        <div class="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
          <div class="flex items-center gap-2">
            <div v-if="'color' in col" class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: col.color }" />
            <span class="text-sm font-medium">{{ col.label }}</span>
            <span class="text-xs text-[var(--text-secondary)]">{{ col.tasks.length }}</span>
          </div>
          <button class="btn-ghost p-1" @click="addTask('color' in col ? col.id : 'inbox')">
            <Plus :size="14" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-2 space-y-2">
          <div
            v-for="task in col.tasks"
            :key="task.id"
            class="card p-3 cursor-pointer hover:shadow-card-hover transition-all active:scale-[0.98]"
            :class="{ 'opacity-60': task.isCompleted }"
            @click="openDetail(task.id)"
          >
            <div class="flex items-start justify-between gap-2">
              <span class="text-sm flex-1" :class="{ 'line-through text-[var(--text-secondary)]': task.isCompleted }">{{ task.title }}</span>
              <span
                v-if="task.priority !== 'none'"
                class="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                :class="priorityColors[task.priority]"
              >
                {{ priorityLabels[task.priority] }}
              </span>
            </div>
            <div v-if="task.dueDate" class="text-xs text-[var(--text-secondary)] mt-1.5">
              {{ format(parseISO(task.dueDate), 'MM月dd日 HH:mm') }}
            </div>
            <div class="flex items-center gap-2 mt-1.5">
              <div v-if="task.tagIds.length > 0" class="flex gap-1 flex-1">
                <span
                  v-for="tagId in task.tagIds"
                  :key="tagId"
                  class="text-[10px] px-1.5 py-0.5 rounded-full"
                  :style="{ backgroundColor: (taskStore.tags.find(t => t.id === tagId)?.color || '#ccc') + '20', color: taskStore.tags.find(t => t.id === tagId)?.color }"
                >
                  {{ taskStore.tags.find(t => t.id === tagId)?.name }}
                </span>
              </div>
              <Star v-if="task.isImportant" :size="12" class="text-yellow-500" fill="currentColor" />
              <CheckCircle2 v-if="task.isCompleted" :size="12" class="text-green-500" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Habits Section -->
    <div v-if="habitStore.habits.length > 0" class="border-t-2 border-[var(--border)] shrink-0 bg-white dark:bg-[var(--bg-card)]">
      <button
        class="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        @click="showHabits = !showHabits"
      >
        <component :is="showHabits ? ChevronDown : ChevronRight" :size="14" />
        今日习惯 ({{ habitStore.habits.filter(h => isHabitCheckedToday(h.id)).length }}/{{ habitStore.habits.length }})
      </button>

      <div v-if="showHabits" class="flex gap-2 px-4 pb-3 overflow-x-auto">
        <div
          v-for="habit in habitStore.habits"
          :key="habit.id"
          class="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--border)] shrink-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <button
            class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90"
            :class="isHabitCheckedToday(habit.id) ? 'text-white scale-110' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-green-100 dark:hover:bg-green-500/20'"
            :style="isHabitCheckedToday(habit.id) ? { backgroundColor: habit.color } : {}"
            @click="toggleHabit(habit.id)"
          >
            <Check :size="16" />
          </button>
          <div class="min-w-0">
            <div class="text-sm whitespace-nowrap" :class="{ 'line-through text-[var(--text-secondary)]': isHabitCheckedToday(habit.id) }">{{ habit.name }}</div>
            <div class="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
              <Flame :size="10" :class="habitStore.getStreak(habit.id) > 0 ? 'text-orange-500' : 'text-gray-400'" />
              <span>连续 {{ habitStore.getStreak(habit.id) }} 天</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <TaskDetailModal :task-id="detailTaskId" @close="detailTaskId = null" />
  </div>
</template>