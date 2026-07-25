<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { useHabitStore } from '@/stores/habitStore'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isToday, addMonths, subMonths, parseISO, setYear, setMonth, getYear, getMonth } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, ChevronDown, Plus, X } from 'lucide-vue-next'
import TaskDetailModal from '@/components/TaskDetailModal.vue'

const taskStore = useTaskStore()
const habitStore = useHabitStore()

const currentDate = ref(new Date())
const selectedDate = ref(format(new Date(), 'yyyy-MM-dd'))
const detailTaskId = ref<string | null>(null)
const viewType = ref<'month' | 'week'>('month')
const showYearPicker = ref(false)
const showMonthPicker = ref(false)
const showQuickAdd = ref(false)
const quickAddText = ref('')
const quickAddDate = ref('')
const quickAddInput = ref<HTMLInputElement | null>(null)

const currentYear = computed(() => getYear(currentDate.value))
const currentMonth = computed(() => getMonth(currentDate.value))

const monthDays = computed(() => {
  const start = startOfWeek(startOfMonth(currentDate.value), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(currentDate.value), { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
})

const weekDays = computed(() => {
  const start = startOfWeek(currentDate.value, { weekStartsOn: 1 })
  const end = endOfWeek(currentDate.value, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
})

const weekDayNames = ['一', '二', '三', '四', '五', '六', '日']

const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

// Generate year range
const yearRange = computed(() => {
  const years: number[] = []
  for (let y = currentYear.value - 5; y <= currentYear.value + 5; y++) {
    years.push(y)
  }
  return years
})

function getTasksForDate(date: Date) {
  return taskStore.tasks.filter(t => {
    if (t.dueDate && isSameDay(parseISO(t.dueDate), date)) return true
    if (t.completedAt && isSameDay(parseISO(t.completedAt), date)) return true
    return false
  }).sort((a, b) => {
    // Completed tasks at the bottom
    if (a.isCompleted && !b.isCompleted) return 1
    if (!a.isCompleted && b.isCompleted) return -1
    return 0
  })
}

function getHabitsForDate(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd')
  return habitStore.habits.filter(h =>
    habitStore.records.some(r => r.habitId === h.id && r.date === dateStr)
  )
}

function prevMonth() { currentDate.value = subMonths(currentDate.value, 1) }
function nextMonth() { currentDate.value = addMonths(currentDate.value, 1) }
function prevWeek() { currentDate.value = new Date(currentDate.value.getTime() - 7 * 24 * 60 * 60 * 1000) }
function nextWeek() { currentDate.value = new Date(currentDate.value.getTime() + 7 * 24 * 60 * 60 * 1000) }

function goToToday() {
  currentDate.value = new Date()
  selectedDate.value = format(new Date(), 'yyyy-MM-dd')
}

function selectYear(year: number) {
  currentDate.value = setYear(currentDate.value, year)
  showYearPicker.value = false
}

function selectMonth(month: number) {
  currentDate.value = setMonth(currentDate.value, month)
  showMonthPicker.value = false
}

function openTaskDetail(taskId: string) {
  detailTaskId.value = taskId
}

function handleDayClick(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd')
  selectedDate.value = dateStr
  quickAddDate.value = dateStr
  showQuickAdd.value = true
  nextTick(() => {
    quickAddInput.value?.focus()
  })
}

async function handleQuickAdd() {
  const text = quickAddText.value.trim()
  if (!text) {
    showQuickAdd.value = false
    return
  }
  const newTask = await taskStore.addTask(text, 'inbox')
  const dueDate = new Date(quickAddDate.value)
  dueDate.setHours(23, 59, 0, 0)
  await taskStore.updateTask(newTask.id, { dueDate: dueDate.toISOString() })
  quickAddText.value = ''
  showQuickAdd.value = false
}
</script>

<template>
  <div class="h-full flex flex-col bg-white dark:bg-[var(--bg-card)]">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
      <div class="flex items-center gap-2">
        <button class="btn-ghost p-1" @click="viewType === 'month' ? prevMonth() : prevWeek()">
          <ChevronLeft :size="20" />
        </button>

        <!-- Year/Month Display -->
        <div class="flex items-center gap-1 relative">
          <button
            class="text-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded-btn transition-colors flex items-center gap-0.5"
            @click="showMonthPicker = !showMonthPicker; showYearPicker = false"
          >
            {{ format(currentDate, 'yyyy年 M月', { locale: zhCN }) }}
            <ChevronDown :size="14" class="text-[var(--text-secondary)]" />
          </button>

          <!-- Month Picker Dropdown -->
          <div v-if="showMonthPicker" class="absolute top-full left-0 mt-1 bg-white dark:bg-[var(--bg-card)] border border-[var(--border)] rounded-card shadow-popup z-20 p-2 w-48 animate-scale-in">
            <div class="flex items-center justify-between mb-2 px-1">
              <button class="btn-ghost p-1" @click="currentDate = setYear(currentDate, currentYear - 1)"><ChevronLeft :size="14" /></button>
              <span class="text-sm font-medium">{{ currentYear }}</span>
              <button class="btn-ghost p-1" @click="currentDate = setYear(currentDate, currentYear + 1)"><ChevronRight :size="14" /></button>
            </div>
            <div class="grid grid-cols-3 gap-1">
              <button
                v-for="(name, idx) in monthNames"
                :key="idx"
                class="py-2 text-sm rounded-btn hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                :class="currentMonth === idx ? 'bg-primary-500 text-white hover:bg-primary-600' : ''"
                @click="selectMonth(idx)"
              >
                {{ name }}
              </button>
            </div>
          </div>
        </div>

        <button class="btn-ghost p-1" @click="viewType === 'month' ? nextMonth() : nextWeek()">
          <ChevronRight :size="20" />
        </button>

        <button class="btn-secondary text-sm !py-1 ml-2" @click="goToToday">今天</button>
      </div>

      <div class="flex gap-1">
        <button class="btn text-sm" :class="viewType === 'month' ? 'btn-primary' : 'btn-secondary'" @click="viewType = 'month'">月</button>
        <button class="btn text-sm" :class="viewType === 'week' ? 'btn-primary' : 'btn-secondary'" @click="viewType = 'week'">周</button>
      </div>
    </div>

    <!-- Month View -->
    <div v-if="viewType === 'month'" class="flex-1 flex flex-col overflow-hidden">
      <div class="grid grid-cols-7 border-b border-[var(--border)]">
        <div v-for="day in weekDayNames" :key="day" class="text-center text-xs font-medium text-[var(--text-secondary)] py-2">
          {{ day }}
        </div>
      </div>
      <div class="grid grid-cols-7 flex-1 auto-rows-fr">
        <div
          v-for="day in monthDays"
          :key="day.toISOString()"
          class="group border-r border-b border-[var(--border)] p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors overflow-hidden"
          :class="{
            'bg-primary-50/30 dark:bg-primary-500/5': isToday(day),
            'opacity-40': format(day, 'M') !== format(currentDate, 'M')
          }"
          @click="handleDayClick(day)"
        >
          <div class="flex items-center justify-between mb-0.5">
            <span class="text-xs font-medium" :class="isToday(day) ? 'text-primary-500 font-bold' : ''">
              {{ format(day, 'd') }}
            </span>
            <Plus
              :size="12"
              class="text-gray-300 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <div class="space-y-0.5">
            <div
              v-for="task in getTasksForDate(day).slice(0, 3)"
              :key="task.id"
              class="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
              :class="{ 'line-through opacity-60': task.isCompleted }"
              :style="{ backgroundColor: (taskStore.lists.find(l => l.id === task.listId)?.color || '#4772FA') + '20', color: taskStore.lists.find(l => l.id === task.listId)?.color }"
              @click.stop="openTaskDetail(task.id)"
            >
              {{ task.title }}
            </div>
            <div
              v-for="habit in getHabitsForDate(day)"
              :key="'h-' + habit.id"
              class="text-[10px] px-1 py-0.5 rounded truncate"
              :style="{ backgroundColor: habit.color + '15', color: habit.color }"
            >
              {{ habit.name }} ✓
            </div>
            <div v-if="getTasksForDate(day).length > 3" class="text-[10px] text-[var(--text-secondary)] px-1">
              +{{ getTasksForDate(day).length - 3 }} 更多
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Week View -->
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <div class="grid grid-cols-7 border-b border-[var(--border)]">
        <div v-for="(day, idx) in weekDays" :key="day.toISOString()" class="text-center py-2 border-r border-[var(--border)] last:border-r-0">
          <div class="text-xs text-[var(--text-secondary)]">{{ weekDayNames[idx] }}</div>
          <div class="text-sm font-bold mt-0.5" :class="isToday(day) ? 'text-primary-500' : ''">{{ format(day, 'd') }}</div>
        </div>
      </div>
      <div class="grid grid-cols-7 flex-1 auto-rows-fr">
        <div
          v-for="day in weekDays"
          :key="day.toISOString()"
          class="group border-r border-b border-[var(--border)] p-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors overflow-y-auto"
          :class="{ 'bg-primary-50/30 dark:bg-primary-500/5': isToday(day) }"
          @click="handleDayClick(day)"
        >
          <div class="space-y-1">
            <div
              v-for="task in getTasksForDate(day)"
              :key="task.id"
              class="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
              :class="{ 'line-through opacity-60': task.isCompleted }"
              :style="{ backgroundColor: (taskStore.lists.find(l => l.id === task.listId)?.color || '#4772FA') + '20', color: taskStore.lists.find(l => l.id === task.listId)?.color }"
              @click.stop="openTaskDetail(task.id)"
            >
              {{ task.title }}
            </div>
            <div
              v-for="habit in getHabitsForDate(day)"
              :key="'h-' + habit.id"
              class="text-xs px-1.5 py-0.5 rounded truncate"
              :style="{ backgroundColor: habit.color + '15', color: habit.color }"
            >
              {{ habit.name }} ✓
            </div>
            <div v-if="getTasksForDate(day).length === 0 && getHabitsForDate(day).length === 0" class="text-[10px] text-gray-300 text-center pt-2 group-hover:text-primary-400 transition-colors">
              点击添加
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Add Popup -->
    <Teleport to="body">
      <div v-if="showQuickAdd" class="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center" @click.self="showQuickAdd = false">
        <div class="relative w-full md:max-w-md md:mx-4 bg-white dark:bg-[var(--bg-card)] rounded-t-2xl md:rounded-2xl shadow-popup animate-slide-up p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-[var(--text-secondary)]">
              {{ format(parseISO(quickAddDate), 'MM月dd日 EEEE', { locale: zhCN }) }}
            </span>
            <button class="btn-ghost p-1" @click="showQuickAdd = false">
              <X :size="18" />
            </button>
          </div>
          <input
            ref="quickAddInput"
            v-model="quickAddText"
            type="text"
            class="input text-base"
            placeholder="添加任务..."
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

    <!-- Task Detail Modal -->
    <TaskDetailModal :task-id="detailTaskId" @close="detailTaskId = null" />
  </div>
</template>