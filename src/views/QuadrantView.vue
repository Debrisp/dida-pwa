<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { AlertCircle, Plus, Circle, CheckCircle2 } from 'lucide-vue-next'
import TaskDetailModal from '@/components/TaskDetailModal.vue'

const taskStore = useTaskStore()

const activeTasks = computed(() => taskStore.tasks.filter(t => !t.isCompleted))

const q1 = computed(() => activeTasks.value.filter(t => t.isImportant && t.isUrgent))
const q2 = computed(() => activeTasks.value.filter(t => t.isImportant && !t.isUrgent))
const q3 = computed(() => activeTasks.value.filter(t => !t.isImportant && t.isUrgent))
const q4 = computed(() => activeTasks.value.filter(t => !t.isImportant && !t.isUrgent))

const detailTaskId = ref<string | null>(null)
const draggedTaskId = ref<string | null>(null)

// Quick add state for each quadrant
const showingInput = ref<{ q1: boolean; q2: boolean; q3: boolean; q4: boolean }>({ q1: false, q2: false, q3: false, q4: false })
const newTaskText = ref('')

function showAddInput(quadrant: string) {
  showingInput.value = { q1: false, q2: false, q3: false, q4: false, [quadrant]: true }
  newTaskText.value = ''
}

async function addToQuadrant(quadrant: string) {
  const text = newTaskText.value.trim()
  if (!text) return
  const isImportant = quadrant === 'q1' || quadrant === 'q2'
  const isUrgent = quadrant === 'q1' || quadrant === 'q3'
  const task = await taskStore.addTask(text, 'inbox')
  await taskStore.updateTask(task.id, { isImportant, isUrgent })
  newTaskText.value = ''
  showingInput.value = { q1: false, q2: false, q3: false, q4: false }
}

async function toggleComplete(id: string) {
  await taskStore.toggleTask(id)
}

function openDetail(id: string) {
  detailTaskId.value = id
}

// Drag and drop
function onDragStart(e: DragEvent, taskId: string) {
  draggedTaskId.value = taskId
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
  }
}

async function onDrop(e: DragEvent, quadrant: string) {
  e.preventDefault()
  const taskId = draggedTaskId.value
  if (!taskId) return
  const isImportant = quadrant === 'q1' || quadrant === 'q2'
  const isUrgent = quadrant === 'q1' || quadrant === 'q3'
  await taskStore.updateTask(taskId, { isImportant, isUrgent })
  draggedTaskId.value = null
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}
</script>

<template>
  <div class="h-full overflow-y-auto bg-white dark:bg-[var(--bg-card)] p-4">
    <h2 class="text-lg font-semibold mb-4">四象限</h2>

    <div class="grid grid-cols-2 gap-2 h-[calc(100%-3rem)]">
      <!-- Q1: 重要且紧急 -->
      <div
        class="flex flex-col rounded-card border-2 border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-500/5 overflow-hidden"
        @dragover="onDragOver"
        @drop="onDrop($event, 'q1')"
      >
        <div class="flex items-center justify-between px-3 py-2 bg-red-100 dark:bg-red-500/10 border-b border-red-200 dark:border-red-800">
          <div class="flex items-center gap-1.5">
            <AlertCircle :size="14" class="text-red-500" />
            <span class="text-sm font-medium text-red-600 dark:text-red-400">重要且紧急</span>
            <span class="text-xs text-red-400">{{ q1.length }}</span>
          </div>
          <button class="btn-ghost p-0.5 rounded hover:bg-red-200/50 dark:hover:bg-red-500/20" @click="showAddInput('q1')">
            <Plus :size="16" class="text-red-500" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-1">
          <div v-if="showingInput.q1" class="flex gap-1 mb-1">
            <input
              v-model="newTaskText"
              type="text"
              class="input text-xs !py-1"
              placeholder="输入任务..."
              autofocus
              @keydown.enter="addToQuadrant('q1')"
              @keydown.escape="showingInput = { q1: false, q2: false, q3: false, q4: false }"
            />
          </div>
          <div
            v-for="task in q1"
            :key="task.id"
            class="flex items-center gap-2 px-2 py-1.5 rounded-btn hover:bg-white/50 dark:hover:bg-white/5 cursor-pointer text-sm group"
            draggable="true"
            @dragstart="onDragStart($event, task.id)"
            @click="openDetail(task.id)"
          >
            <button class="shrink-0" @click.stop="toggleComplete(task.id)">
              <CheckCircle2 v-if="task.isCompleted" :size="14" class="text-green-500" />
              <Circle v-else :size="14" class="text-gray-300 group-hover:text-primary-500" />
            </button>
            <span class="truncate">{{ task.title }}</span>
          </div>
          <div v-if="q1.length === 0 && !showingInput.q1" class="text-xs text-[var(--text-secondary)] text-center py-4">
            拖拽任务到此处
          </div>
        </div>
      </div>

      <!-- Q2: 重要不紧急 -->
      <div
        class="flex flex-col rounded-card border-2 border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-500/5 overflow-hidden"
        @dragover="onDragOver"
        @drop="onDrop($event, 'q2')"
      >
        <div class="flex items-center justify-between px-3 py-2 bg-blue-100 dark:bg-blue-500/10 border-b border-blue-200 dark:border-blue-800">
          <div class="flex items-center gap-1.5">
            <span class="text-sm font-medium text-blue-600 dark:text-blue-400">重要不紧急</span>
            <span class="text-xs text-blue-400">{{ q2.length }}</span>
          </div>
          <button class="btn-ghost p-0.5 rounded hover:bg-blue-200/50 dark:hover:bg-blue-500/20" @click="showAddInput('q2')">
            <Plus :size="16" class="text-blue-500" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-1">
          <div v-if="showingInput.q2" class="flex gap-1 mb-1">
            <input
              v-model="newTaskText"
              type="text"
              class="input text-xs !py-1"
              placeholder="输入任务..."
              autofocus
              @keydown.enter="addToQuadrant('q2')"
              @keydown.escape="showingInput = { q1: false, q2: false, q3: false, q4: false }"
            />
          </div>
          <div
            v-for="task in q2"
            :key="task.id"
            class="flex items-center gap-2 px-2 py-1.5 rounded-btn hover:bg-white/50 dark:hover:bg-white/5 cursor-pointer text-sm group"
            draggable="true"
            @dragstart="onDragStart($event, task.id)"
            @click="openDetail(task.id)"
          >
            <button class="shrink-0" @click.stop="toggleComplete(task.id)">
              <CheckCircle2 v-if="task.isCompleted" :size="14" class="text-green-500" />
              <Circle v-else :size="14" class="text-gray-300 group-hover:text-primary-500" />
            </button>
            <span class="truncate">{{ task.title }}</span>
          </div>
          <div v-if="q2.length === 0 && !showingInput.q2" class="text-xs text-[var(--text-secondary)] text-center py-4">
            拖拽任务到此处
          </div>
        </div>
      </div>

      <!-- Q3: 不重要紧急 -->
      <div
        class="flex flex-col rounded-card border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-500/5 overflow-hidden"
        @dragover="onDragOver"
        @drop="onDrop($event, 'q3')"
      >
        <div class="flex items-center justify-between px-3 py-2 bg-yellow-100 dark:bg-yellow-500/10 border-b border-yellow-200 dark:border-yellow-800">
          <div class="flex items-center gap-1.5">
            <span class="text-sm font-medium text-yellow-600 dark:text-yellow-400">不重要紧急</span>
            <span class="text-xs text-yellow-400">{{ q3.length }}</span>
          </div>
          <button class="btn-ghost p-0.5 rounded hover:bg-yellow-200/50 dark:hover:bg-yellow-500/20" @click="showAddInput('q3')">
            <Plus :size="16" class="text-yellow-500" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-1">
          <div v-if="showingInput.q3" class="flex gap-1 mb-1">
            <input
              v-model="newTaskText"
              type="text"
              class="input text-xs !py-1"
              placeholder="输入任务..."
              autofocus
              @keydown.enter="addToQuadrant('q3')"
              @keydown.escape="showingInput = { q1: false, q2: false, q3: false, q4: false }"
            />
          </div>
          <div
            v-for="task in q3"
            :key="task.id"
            class="flex items-center gap-2 px-2 py-1.5 rounded-btn hover:bg-white/50 dark:hover:bg-white/5 cursor-pointer text-sm group"
            draggable="true"
            @dragstart="onDragStart($event, task.id)"
            @click="openDetail(task.id)"
          >
            <button class="shrink-0" @click.stop="toggleComplete(task.id)">
              <CheckCircle2 v-if="task.isCompleted" :size="14" class="text-green-500" />
              <Circle v-else :size="14" class="text-gray-300 group-hover:text-primary-500" />
            </button>
            <span class="truncate">{{ task.title }}</span>
          </div>
          <div v-if="q3.length === 0 && !showingInput.q3" class="text-xs text-[var(--text-secondary)] text-center py-4">
            拖拽任务到此处
          </div>
        </div>
      </div>

      <!-- Q4: 不重要不紧急 -->
      <div
        class="flex flex-col rounded-card border-2 border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-500/5 overflow-hidden"
        @dragover="onDragOver"
        @drop="onDrop($event, 'q4')"
      >
        <div class="flex items-center justify-between px-3 py-2 bg-green-100 dark:bg-green-500/10 border-b border-green-200 dark:border-green-800">
          <div class="flex items-center gap-1.5">
            <span class="text-sm font-medium text-green-600 dark:text-green-400">不重要不紧急</span>
            <span class="text-xs text-green-400">{{ q4.length }}</span>
          </div>
          <button class="btn-ghost p-0.5 rounded hover:bg-green-200/50 dark:hover:bg-green-500/20" @click="showAddInput('q4')">
            <Plus :size="16" class="text-green-500" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-1">
          <div v-if="showingInput.q4" class="flex gap-1 mb-1">
            <input
              v-model="newTaskText"
              type="text"
              class="input text-xs !py-1"
              placeholder="输入任务..."
              autofocus
              @keydown.enter="addToQuadrant('q4')"
              @keydown.escape="showingInput = { q1: false, q2: false, q3: false, q4: false }"
            />
          </div>
          <div
            v-for="task in q4"
            :key="task.id"
            class="flex items-center gap-2 px-2 py-1.5 rounded-btn hover:bg-white/50 dark:hover:bg-white/5 cursor-pointer text-sm group"
            draggable="true"
            @dragstart="onDragStart($event, task.id)"
            @click="openDetail(task.id)"
          >
            <button class="shrink-0" @click.stop="toggleComplete(task.id)">
              <CheckCircle2 v-if="task.isCompleted" :size="14" class="text-green-500" />
              <Circle v-else :size="14" class="text-gray-300 group-hover:text-primary-500" />
            </button>
            <span class="truncate">{{ task.title }}</span>
          </div>
          <div v-if="q4.length === 0 && !showingInput.q4" class="text-xs text-[var(--text-secondary)] text-center py-4">
            拖拽任务到此处
          </div>
        </div>
      </div>
    </div>

    <TaskDetailModal :task-id="detailTaskId" @close="detailTaskId = null" />
  </div>
</template>