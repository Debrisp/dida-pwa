<script setup lang="ts">
import { computed } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { usePomodoroStore } from '@/stores/pomodoroStore'
import { useHabitStore } from '@/stores/habitStore'
import { CheckCircle2, Timer, TrendingUp, Target } from 'lucide-vue-next'
import { format, subDays, isAfter, parseISO } from 'date-fns'

const taskStore = useTaskStore()
const pomodoro = usePomodoroStore()
const habitStore = useHabitStore()

const totalTasks = computed(() => taskStore.tasks.length)
const completedTasks = computed(() => taskStore.tasks.filter(t => t.isCompleted).length)
const completionRate = computed(() => totalTasks.value > 0 ? Math.round((completedTasks.value / totalTasks.value) * 100) : 0)

const todayTasks = computed(() => {
  const today = format(new Date(), 'yyyy-MM-dd')
  return taskStore.tasks.filter(t => {
    if (!t.dueDate) return false
    return t.dueDate.startsWith(today)
  }).length
})

const totalPomodoros = computed(() => pomodoro.records.filter(r => r.type === 'focus').length)
const totalFocusMinutes = computed(() => {
  return Math.round(pomodoro.records.filter(r => r.type === 'focus').reduce((sum, r) => sum + r.duration, 0) / 60)
})

const totalHabitChecks = computed(() => habitStore.records.length)

const tasksByList = computed(() => {
  return taskStore.lists.filter(l => !l.isArchived).map(l => ({
    name: l.name,
    color: l.color,
    total: taskStore.tasks.filter(t => t.listId === l.id).length,
    completed: taskStore.tasks.filter(t => t.listId === l.id && t.isCompleted).length
  }))
})
</script>

<template>
  <div class="h-full overflow-y-auto bg-[var(--bg)] p-4">
    <h2 class="text-lg font-semibold mb-4">数据统计</h2>

    <!-- Overview Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="card p-4">
        <div class="flex items-center gap-2 mb-2">
          <CheckCircle2 :size="16" class="text-primary-500" />
          <span class="text-xs text-[var(--text-secondary)]">完成任务</span>
        </div>
        <div class="text-2xl font-bold">{{ completedTasks }}</div>
        <div class="text-xs text-[var(--text-secondary)]">完成率 {{ completionRate }}%</div>
      </div>

      <div class="card p-4">
        <div class="flex items-center gap-2 mb-2">
          <Target :size="16" class="text-red-500" />
          <span class="text-xs text-[var(--text-secondary)]">今日任务</span>
        </div>
        <div class="text-2xl font-bold">{{ todayTasks }}</div>
        <div class="text-xs text-[var(--text-secondary)]">今天到期</div>
      </div>

      <div class="card p-4">
        <div class="flex items-center gap-2 mb-2">
          <Timer :size="16" class="text-green-500" />
          <span class="text-xs text-[var(--text-secondary)]">专注次数</span>
        </div>
        <div class="text-2xl font-bold">{{ totalPomodoros }}</div>
        <div class="text-xs text-[var(--text-secondary)]">累计 {{ totalFocusMinutes }} 分钟</div>
      </div>

      <div class="card p-4">
        <div class="flex items-center gap-2 mb-2">
          <TrendingUp :size="16" class="text-yellow-500" />
          <span class="text-xs text-[var(--text-secondary)]">习惯打卡</span>
        </div>
        <div class="text-2xl font-bold">{{ totalHabitChecks }}</div>
        <div class="text-xs text-[var(--text-secondary)]">总打卡次数</div>
      </div>
    </div>

    <!-- Tasks by List -->
    <div class="card p-4 mb-4">
      <h3 class="text-sm font-medium mb-3">各清单完成情况</h3>
      <div class="space-y-2">
        <div v-for="item in tasksByList" :key="item.name" class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: item.color }" />
          <span class="text-sm flex-1">{{ item.name }}</span>
          <span class="text-xs text-[var(--text-secondary)]">{{ item.completed }}/{{ item.total }}</span>
          <div class="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :style="{ width: item.total > 0 ? (item.completed / item.total) * 100 + '%' : '0%', backgroundColor: item.color }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Pomodoro Records -->
    <div class="card p-4">
      <h3 class="text-sm font-medium mb-3">最近专注记录</h3>
      <div v-if="pomodoro.records.length === 0" class="text-xs text-[var(--text-secondary)] text-center py-4">
        暂无专注记录
      </div>
      <div class="space-y-1">
        <div
          v-for="record in pomodoro.records.filter(r => r.type === 'focus').slice(0, 10)"
          :key="record.id"
          class="flex items-center justify-between py-1.5 text-sm"
        >
          <div class="flex items-center gap-2">
            <Timer :size="14" class="text-green-500" />
            <span>{{ record.taskTitle || '未关联任务' }}</span>
          </div>
          <div class="text-xs text-[var(--text-secondary)]">
            {{ format(parseISO(record.startTime), 'MM/dd HH:mm') }} · {{ Math.round(record.duration / 60) }}分钟
          </div>
        </div>
      </div>
    </div>
  </div>
</template>