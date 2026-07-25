<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTaskStore } from '@/stores/taskStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { usePomodoroStore } from '@/stores/pomodoroStore'
import { useHabitStore } from '@/stores/habitStore'
import { useCountdownStore } from '@/stores/countdownStore'
import {
  ListTodo, Calendar, Columns3, Timer, CheckSquare, Grid3X3, Clock, BarChart3, Settings, Search, Plus
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const taskStore = useTaskStore()
const settingsStore = useSettingsStore()
const pomodoroStore = usePomodoroStore()
const habitStore = useHabitStore()
const countdownStore = useCountdownStore()

const showSearch = ref(false)
const searchQuery = ref('')
const showQuickAdd = ref(false)
const quickAddText = ref('')

const navItems = [
  { path: '/', label: '任务', icon: ListTodo },
  { path: '/calendar', label: '日历', icon: Calendar },
  { path: '/kanban', label: '看板', icon: Columns3 },
  { path: '/pomodoro', label: '番茄', icon: Timer },
  { path: '/habits', label: '习惯', icon: CheckSquare },
  { path: '/quadrant', label: '四象限', icon: Grid3X3 },
  { path: '/countdowns', label: '倒数日', icon: Clock },
  { path: '/statistics', label: '统计', icon: BarChart3 },
  { path: '/settings', label: '设置', icon: Settings },
]

const currentNav = computed(() => route.path)

function navigateTo(path: string) {
  router.push(path)
}

async function handleQuickAdd() {
  const text = quickAddText.value.trim()
  if (!text) return
  await taskStore.addTask(text)
  quickAddText.value = ''
  showQuickAdd.value = false
}

onMounted(async () => {
  await settingsStore.load()
  settingsStore.applyTheme()
  settingsStore.applyFontSize()
  await Promise.all([
    taskStore.loadTasks(),
    taskStore.loadLists(),
    taskStore.loadTags(),
    taskStore.loadFilters(),
    taskStore.loadFolders(),
    pomodoroStore.loadRecords(),
    habitStore.loadAll(),
    countdownStore.loadAll()
  ])
})
</script>

<template>
  <div class="h-full flex flex-col bg-[var(--bg)]">
    <!-- Desktop Header -->
    <header class="desktop-only h-12 flex items-center justify-between px-4 border-b border-[var(--border)] bg-white dark:bg-[var(--bg-card)] shrink-0">
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-bold text-primary-500">滴答清单</h1>
        <button class="btn-ghost text-sm" @click="showSearch = !showSearch">
          <Search :size="16" />
          <span>搜索</span>
        </button>
      </div>
      <div class="flex items-center gap-1">
        <button class="btn-primary text-sm !py-1.5" @click="showQuickAdd = true">
          <Plus :size="16" />
          <span>添加任务</span>
        </button>
      </div>
    </header>

    <!-- Mobile Header -->
    <header class="mobile-only h-12 flex items-center justify-between px-4 border-b border-[var(--border)] bg-white dark:bg-[var(--bg-card)] shrink-0" style="padding-top: var(--safe-top)">
      <h1 class="text-lg font-bold text-primary-500">滴答清单</h1>
      <div class="flex items-center gap-2">
        <button class="btn-ghost p-2" @click="showSearch = !showSearch">
          <Search :size="18" />
        </button>
        <button class="btn-primary p-2 !rounded-full" @click="showQuickAdd = true">
          <Plus :size="18" />
        </button>
      </div>
    </header>

    <!-- Search Bar -->
    <div v-if="showSearch" class="px-4 py-2 border-b border-[var(--border)] bg-white dark:bg-[var(--bg-card)] animate-slide-down">
      <input
        v-model="searchQuery"
        type="text"
        class="input"
        placeholder="搜索任务..."
        autofocus
        @keydown.escape="showSearch = false"
      />
    </div>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden md:ml-56">
      <router-view />
    </main>

    <!-- Mobile Bottom Nav -->
    <nav class="mobile-only h-14 flex items-center border-t border-[var(--border)] bg-white dark:bg-[var(--bg-card)] shrink-0" style="padding-bottom: var(--safe-bottom)">
      <button
        v-for="item in navItems.slice(0, 5)"
        :key="item.path"
        class="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
        :class="currentNav === item.path ? 'text-primary-500' : 'text-[var(--text-secondary)]'"
        @click="navigateTo(item.path)"
      >
        <component :is="item.icon" :size="20" />
        <span class="text-[10px]">{{ item.label }}</span>
      </button>
    </nav>

    <!-- Desktop Sidebar -->
    <aside class="desktop-only fixed left-0 top-12 bottom-0 w-56 border-r border-[var(--border)] bg-white dark:bg-[var(--bg-card)] flex flex-col py-2 overflow-y-auto">
      <div v-for="item in navItems" :key="item.path">
        <button
          class="sidebar-item w-[calc(100%-8px)]"
          :class="{ active: currentNav === item.path }"
          @click="navigateTo(item.path)"
        >
          <component :is="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </aside>

    <!-- Quick Add Modal -->
    <Teleport to="body">
      <div v-if="showQuickAdd" class="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-24" @click.self="showQuickAdd = false">
        <div class="card w-full max-w-md mx-4 p-4 animate-scale-in">
          <input
            v-model="quickAddText"
            type="text"
            class="input text-lg"
            placeholder="快速添加任务..."
            autofocus
            @keydown.enter="handleQuickAdd"
            @keydown.escape="showQuickAdd = false"
          />
          <div class="flex justify-end gap-2 mt-3">
            <button class="btn-secondary text-sm" @click="showQuickAdd = false">取消</button>
            <button class="btn-primary text-sm" @click="handleQuickAdd">添加</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>