<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePomodoroStore } from '@/stores/pomodoroStore'
import { useTaskStore } from '@/stores/taskStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { Play, Pause, Square, SkipForward, Settings } from 'lucide-vue-next'

const pomodoro = usePomodoroStore()
const taskStore = useTaskStore()
const settingsStore = useSettingsStore()

const showSettings = ref(false)

const todayTasks = computed(() => taskStore.tasks.filter(t => !t.isCompleted))

const radius = 120
const circumference = 2 * Math.PI * radius

const strokeDashoffset = computed(() => {
  return circumference * (1 - pomodoro.progress)
})

const colorMap = {
  focus: '#4772FA',
  shortBreak: '#22C55E',
  longBreak: '#8B5CF6'
}

const labelMap = {
  focus: '专注',
  shortBreak: '短休息',
  longBreak: '长休息'
}

function startWithTask(taskId: string) {
  const task = taskStore.tasks.find(t => t.id === taskId)
  pomodoro.startTimer(taskId, task?.title || null)
}

function startWithoutTask() {
  pomodoro.startTimer()
}
</script>

<template>
  <div class="h-full flex flex-col items-center justify-center bg-white dark:bg-[var(--bg-card)] p-4">
    <!-- Timer Ring -->
    <div class="relative mb-8">
      <svg width="280" height="280" class="transform -rotate-90">
        <circle cx="140" cy="140" :r="radius" fill="none" stroke="#e5e7eb" stroke-width="8" class="dark:stroke-gray-700" />
        <circle
          cx="140" cy="140" :r="radius" fill="none"
          :stroke="colorMap[pomodoro.currentType]" stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
          class="transition-all duration-1000"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-5xl font-bold font-mono tracking-wider">{{ pomodoro.formattedTime }}</span>
        <span class="text-sm mt-2 px-3 py-1 rounded-full" :style="{ backgroundColor: colorMap[pomodoro.currentType] + '15', color: colorMap[pomodoro.currentType] }">
          {{ labelMap[pomodoro.currentType] }}
        </span>
        <span v-if="pomodoro.currentTaskTitle" class="text-xs text-[var(--text-secondary)] mt-1">
          {{ pomodoro.currentTaskTitle }}
        </span>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex items-center gap-4 mb-8">
      <button
        v-if="!pomodoro.isRunning"
        class="btn-primary text-lg !px-8 !py-3"
        @click="startWithoutTask"
      >
        <Play :size="22" fill="currentColor" />
        开始专注
      </button>

      <template v-else>
        <button class="btn-ghost p-3" @click="pomodoro.stopTimer">
          <Square :size="22" />
        </button>

        <button v-if="!pomodoro.isPaused" class="btn-primary text-lg !px-8 !py-3" @click="pomodoro.pauseTimer">
          <Pause :size="22" />
          暂停
        </button>
        <button v-else class="btn-primary text-lg !px-8 !py-3" @click="pomodoro.resumeTimer">
          <Play :size="22" fill="currentColor" />
          继续
        </button>

        <button class="btn-ghost p-3" @click="pomodoro.stopTimer(); pomodoro.startTimer()">
          <SkipForward :size="22" />
        </button>
      </template>
    </div>

    <!-- Stats -->
    <div class="flex gap-6 mb-8">
      <div class="text-center">
        <div class="text-2xl font-bold text-primary-500">{{ pomodoro.completedCount }}</div>
        <div class="text-xs text-[var(--text-secondary)]">今日番茄</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold">
          {{ pomodoro.records.filter(r => r.type === 'focus').length }}
        </div>
        <div class="text-xs text-[var(--text-secondary)]">总番茄数</div>
      </div>
    </div>

    <!-- Task Selection -->
    <div class="w-full max-w-md">
      <h3 class="text-sm font-medium mb-2">关联任务</h3>
      <div class="space-y-1 max-h-48 overflow-y-auto">
        <div
          v-for="task in todayTasks"
          :key="task.id"
          class="flex items-center gap-2 px-3 py-2 rounded-btn hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          @click="startWithTask(task.id)"
        >
          <span class="text-sm truncate flex-1">{{ task.title }}</span>
          <span class="text-xs text-[var(--text-secondary)]">{{ task.estimatedPomodoros > 0 ? task.estimatedPomodoros + ' 番茄' : '' }}</span>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <button class="btn-ghost mt-4" @click="showSettings = !showSettings">
      <Settings :size="16" />
      <span class="text-sm">设置</span>
    </button>

    <Teleport to="body">
      <div v-if="showSettings" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" @click.self="showSettings = false">
        <div class="card w-full max-w-sm mx-4 p-6 animate-scale-in">
          <h3 class="font-semibold mb-4">番茄设置</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-sm">专注时长（分）</label>
              <input type="number" class="input w-20 text-center" v-model.number="pomodoro.focusMinutes" min="1" max="60" />
            </div>
            <div class="flex items-center justify-between">
              <label class="text-sm">短休息（分）</label>
              <input type="number" class="input w-20 text-center" v-model.number="pomodoro.shortBreakMinutes" min="1" max="30" />
            </div>
            <div class="flex items-center justify-between">
              <label class="text-sm">长休息（分）</label>
              <input type="number" class="input w-20 text-center" v-model.number="pomodoro.longBreakMinutes" min="1" max="60" />
            </div>
            <div class="flex items-center justify-between">
              <label class="text-sm">长休息间隔</label>
              <input type="number" class="input w-20 text-center" v-model.number="pomodoro.longBreakInterval" min="1" max="10" />
            </div>
          </div>
          <button class="btn-primary w-full mt-4" @click="showSettings = false">确定</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>