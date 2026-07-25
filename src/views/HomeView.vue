<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { useHabitStore } from '@/stores/habitStore'
import { Plus, Inbox, Tag, Circle, CheckCircle2, Star, Calendar, ChevronDown, ChevronRight, Pencil, Trash2, X, Check, Flame } from 'lucide-vue-next'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'
import TaskDetailModal from '@/components/TaskDetailModal.vue'

const taskStore = useTaskStore()
const habitStore = useHabitStore()

const selectedListId = ref('inbox')
const detailTaskId = ref<string | null>(null)
const showNewListInput = ref(false)
const newListName = ref('')
const showCompleted = ref(false)

// List editing state
const editingListId = ref<string | null>(null)
const editingListName = ref('')
const editingListColor = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

// Context menu state
const contextMenu = ref<{ show: boolean; x: number; y: number; listId: string; taskId: string }>({
  show: false, x: 0, y: 0, listId: '', taskId: ''
})
const showDeleteConfirm = ref(false)
const deletingListId = ref<string | null>(null)
const showDeleteTaskConfirm = ref(false)
const deletingTaskId = ref<string | null>(null)

// Color palette for lists
const listColors = ['#4772FA', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6366F1']

const activeLists = computed(() => taskStore.lists.filter(l => !l.isArchived))

const filteredTasks = computed(() => {
  return taskStore.tasks
    .filter(t => t.listId === selectedListId.value && !t.isCompleted)
    .sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1
      if (a.priority !== 'high' && b.priority === 'high') return 1
      return a.sortOrder - b.sortOrder
    })
})

const completedTasks = computed(() => {
  return taskStore.tasks.filter(t => t.listId === selectedListId.value && t.isCompleted)
})

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = parseISO(dateStr)
  if (isToday(d)) return `今天 ${format(d, 'HH:mm')}`
  if (isTomorrow(d)) return `明天 ${format(d, 'HH:mm')}`
  return format(d, 'MM月dd日 HH:mm')
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  return isPast(parseISO(dateStr))
}

function selectList(id: string) {
  selectedListId.value = id
  detailTaskId.value = null
}

function openTaskDetail(id: string) {
  detailTaskId.value = id
}

async function handleToggleTask(id: string) {
  await taskStore.toggleTask(id)
}

async function addNewTask() {
  const task = await taskStore.addTask('新任务', selectedListId.value)
  detailTaskId.value = task.id
}

async function handleNewList() {
  const name = newListName.value.trim()
  if (!name) return
  await taskStore.addList(name)
  newListName.value = ''
  showNewListInput.value = false
}

// --- List Context Menu ---
function onListContextMenu(e: MouseEvent, listId: string) {
  e.preventDefault()
  contextMenu.value = { show: true, x: e.clientX, y: e.clientY, listId, taskId: '' }
}

function onTaskContextMenu(e: MouseEvent, taskId: string) {
  e.preventDefault()
  contextMenu.value = { show: true, x: e.clientX, y: e.clientY, listId: '', taskId }
}

function closeContextMenu() {
  contextMenu.value = { show: false, x: 0, y: 0, listId: '', taskId: '' }
}

function startRenameList(listId: string) {
  const list = taskStore.lists.find(l => l.id === listId)
  if (!list) return
  editingListId.value = listId
  editingListName.value = list.name
  editingListColor.value = list.color
  closeContextMenu()
  nextTick(() => editInputRef.value?.focus())
}

async function saveRenameList() {
  const name = editingListName.value.trim()
  if (!name || !editingListId.value) {
    cancelRename()
    return
  }
  await taskStore.updateList(editingListId.value, { name, color: editingListColor.value })
  cancelRename()
}

function cancelRename() {
  editingListId.value = null
  editingListName.value = ''
  editingListColor.value = ''
}

function confirmDeleteList(listId: string) {
  deletingListId.value = listId
  showDeleteConfirm.value = true
  closeContextMenu()
}

async function executeDeleteList() {
  if (!deletingListId.value) return
  await taskStore.deleteList(deletingListId.value)
  if (selectedListId.value === deletingListId.value) {
    selectedListId.value = 'inbox'
  }
  showDeleteConfirm.value = false
  deletingListId.value = null
}

function confirmDeleteTask(taskId: string) {
  deletingTaskId.value = taskId
  showDeleteTaskConfirm.value = true
  closeContextMenu()
}

async function executeDeleteTask() {
  if (!deletingTaskId.value) return
  await taskStore.deleteTask(deletingTaskId.value)
  showDeleteTaskConfirm.value = false
  deletingTaskId.value = null
}

// Close context menu on click outside
function onGlobalClick() {
  closeContextMenu()
}

// --- Habits ---
const todayStr = format(new Date(), 'yyyy-MM-dd')
const showHabits = ref(true)

function isHabitCheckedToday(habitId: string): boolean {
  return habitStore.records.some(r => r.habitId === habitId && r.date === todayStr)
}

async function toggleHabit(habitId: string) {
  await habitStore.toggleRecord(habitId, todayStr)
}
</script>

<template>
  <div class="h-full flex">
    <!-- Left Sidebar (desktop only) -->
    <aside class="hidden md:flex fixed left-56 top-12 bottom-0 w-56 border-r border-[var(--border)] bg-white dark:bg-[var(--bg-card)] flex-col py-2 overflow-y-auto">
      <div class="px-3 mb-2">
        <button class="sidebar-item w-full" :class="{ active: selectedListId === 'inbox' }" @click="selectList('inbox')">
          <Inbox :size="16" />
          <span class="flex-1 text-left">Inbox</span>
          <span class="text-xs text-[var(--text-secondary)]">{{ taskStore.tasks.filter(t => t.listId === 'inbox').length }}</span>
        </button>
      </div>

      <div class="px-3 mb-1">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">清单</span>
          <button class="btn-ghost p-1" @click="showNewListInput = !showNewListInput">
            <Plus :size="14" />
          </button>
        </div>
      </div>

      <div v-if="showNewListInput" class="px-3 mb-2 animate-slide-down">
        <input
          v-model="newListName" type="text" class="input text-sm"
          placeholder="清单名称..." autofocus
          @keydown.enter="handleNewList"
          @keydown.escape="showNewListInput = false"
        />
      </div>

      <div v-for="list in activeLists.filter(l => l.id !== 'inbox')" :key="list.id" class="px-1">
        <!-- Inline Edit Mode -->
        <div v-if="editingListId === list.id" class="px-2 py-1 space-y-2">
          <input
            ref="editInputRef"
            v-model="editingListName"
            type="text"
            class="input text-sm !py-1"
            @keydown.enter="saveRenameList"
            @keydown.escape="cancelRename"
          />
          <div class="flex gap-1 flex-wrap">
            <button
              v-for="c in listColors"
              :key="c"
              class="w-5 h-5 rounded-full border-2 transition-transform"
              :class="editingListColor === c ? 'border-gray-800 dark:border-white scale-125' : 'border-transparent'"
              :style="{ backgroundColor: c }"
              @click="editingListColor = c"
            />
          </div>
          <div class="flex gap-1">
            <button class="btn-primary text-xs !py-0.5 !px-2" @click="saveRenameList">保存</button>
            <button class="btn-ghost text-xs !py-0.5 !px-2" @click="cancelRename">取消</button>
          </div>
        </div>

        <!-- Normal Display -->
        <button
          v-else
          class="sidebar-item w-full group/list"
          :class="{ active: selectedListId === list.id }"
          @click="selectList(list.id)"
          @contextmenu="onListContextMenu($event, list.id)"
        >
          <div class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: list.color }" />
          <span class="flex-1 text-left truncate">{{ list.name }}</span>
          <span class="text-xs text-[var(--text-secondary)]">{{ taskStore.tasks.filter(t => t.listId === list.id).length }}</span>
        </button>
      </div>

      <div class="mt-3 px-3 mb-1">
        <span class="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">标签</span>
      </div>
      <div v-for="tag in taskStore.tags" :key="tag.id" class="px-1">
        <button class="sidebar-item w-full">
          <Tag :size="16" :color="tag.color" />
          <span>{{ tag.name }}</span>
        </button>
      </div>
    </aside>

    <!-- Mobile List Selector -->
    <div class="md:hidden fixed top-12 left-0 right-0 z-10 bg-white dark:bg-[var(--bg-card)] border-b border-[var(--border)] px-3 py-2 flex gap-2 overflow-x-auto">
      <button
        v-for="list in [{id:'inbox',name:'Inbox',color:'#4772FA'}, ...activeLists.filter(l=>l.id!=='inbox')]"
        :key="list.id"
        class="px-3 py-1 text-xs rounded-full whitespace-nowrap transition-all flex-shrink-0"
        :class="selectedListId === list.id ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-[var(--text-secondary)]'"
        @click="selectList(list.id)"
      >
        {{ list.name }}
      </button>
    </div>

    <!-- Task List -->
    <div class="flex-1 flex flex-col bg-white dark:bg-[var(--bg-card)] overflow-hidden pt-10 md:pt-0 md:ml-56">
      <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h2 class="font-semibold text-sm">
          <span v-if="selectedListId === 'inbox'">Inbox</span>
          <span v-else>{{ taskStore.lists.find(l => l.id === selectedListId)?.name }}</span>
        </h2>
        <span class="text-xs text-[var(--text-secondary)]">{{ filteredTasks.length }} 个任务</span>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="filteredTasks.length === 0 && completedTasks.length === 0" class="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]">
          <Inbox :size="48" class="mb-3 opacity-30" />
          <p class="text-sm">暂无任务</p>
          <button class="btn-primary text-sm mt-3" @click="addNewTask">创建任务</button>
        </div>

        <!-- Active Tasks -->
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="group border-b border-[var(--border)] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div class="flex items-center gap-3 px-4 py-3 cursor-pointer" @click="openTaskDetail(task.id)" @contextmenu="onTaskContextMenu($event, task.id)">
            <!-- Complete Button -->
            <button
              class="shrink-0 transition-transform hover:scale-110 active:scale-90"
              @click.stop="handleToggleTask(task.id)"
            >
              <CheckCircle2 v-if="task.isCompleted" :size="20" class="text-green-500" />
              <Circle v-else :size="20" class="text-gray-300 hover:text-primary-500 transition-colors" />
            </button>

            <div class="flex-1 min-w-0">
              <div class="text-sm truncate">{{ task.title }}</div>
              <div class="flex items-center gap-2 mt-0.5">
                <span v-if="task.dueDate" class="text-xs flex items-center gap-1" :class="isOverdue(task.dueDate) ? 'text-red-500 font-medium' : 'text-[var(--text-secondary)]'">
                  <Calendar :size="10" />
                  {{ formatDate(task.dueDate) }}
                </span>
                <span v-if="task.tagIds.length > 0" class="flex gap-1">
                  <span
                    v-for="tagId in task.tagIds"
                    :key="tagId"
                    class="text-[10px] px-1.5 py-0.5 rounded-full"
                    :style="{ backgroundColor: (taskStore.tags.find(t => t.id === tagId)?.color || '#ccc') + '20', color: taskStore.tags.find(t => t.id === tagId)?.color }"
                  >
                    {{ taskStore.tags.find(t => t.id === tagId)?.name }}
                  </span>
                </span>
              </div>
            </div>

            <Star v-if="task.isImportant" :size="14" class="text-yellow-500 shrink-0" fill="currentColor" />
          </div>
        </div>

        <!-- Completed Tasks Section -->
        <div v-if="completedTasks.length > 0" class="border-t-2 border-[var(--border)]">
          <button
            class="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            @click="showCompleted = !showCompleted"
          >
            <component :is="showCompleted ? ChevronDown : ChevronRight" :size="14" />
            已完成 ({{ completedTasks.length }})
          </button>

          <div v-if="showCompleted">
            <div
              v-for="task in completedTasks"
              :key="task.id"
              class="group border-b border-[var(--border)] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors opacity-60 hover:opacity-100"
            >
              <div class="flex items-center gap-3 px-4 py-2.5 cursor-pointer" @click="openTaskDetail(task.id)">
                <button
                  class="shrink-0 transition-transform hover:scale-110 active:scale-90"
                  @click.stop="handleToggleTask(task.id)"
                >
                  <CheckCircle2 :size="20" class="text-green-500" />
                </button>
                <div class="flex-1 min-w-0">
                  <div class="text-sm truncate line-through text-[var(--text-secondary)]">{{ task.title }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Habits Section -->
      <div v-if="habitStore.habits.length > 0" class="border-t-2 border-[var(--border)]">
        <button
          class="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          @click="showHabits = !showHabits"
        >
          <component :is="showHabits ? ChevronDown : ChevronRight" :size="14" />
          今日习惯 ({{ habitStore.habits.filter(h => isHabitCheckedToday(h.id)).length }}/{{ habitStore.habits.length }})
        </button>

        <div v-if="showHabits">
          <div
            v-for="habit in habitStore.habits"
            :key="habit.id"
            class="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <button
              class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90"
              :class="isHabitCheckedToday(habit.id) ? 'text-white scale-110' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-green-100 dark:hover:bg-green-500/20'"
              :style="isHabitCheckedToday(habit.id) ? { backgroundColor: habit.color } : {}"
              @click="toggleHabit(habit.id)"
            >
              <Check :size="16" />
            </button>
            <div class="flex-1 min-w-0">
              <div class="text-sm truncate" :class="{ 'line-through text-[var(--text-secondary)]': isHabitCheckedToday(habit.id) }">{{ habit.name }}</div>
              <div class="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <Flame :size="10" :class="habitStore.getStreak(habit.id) > 0 ? 'text-orange-500' : 'text-gray-400'" />
                <span>连续 {{ habitStore.getStreak(habit.id) }} 天</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Add Button -->
      <div class="p-2 border-t border-[var(--border)]">
        <button class="sidebar-item w-full text-sm" @click="addNewTask">
          <Plus :size="16" />
          <span>添加任务</span>
        </button>
      </div>
    </div>

    <!-- Task Detail Modal -->
    <TaskDetailModal :task-id="detailTaskId" @close="detailTaskId = null" />

    <!-- Context Menu -->
    <Teleport to="body">
      <div
        v-if="contextMenu.show"
        class="fixed z-50 bg-white dark:bg-[var(--bg-card)] border border-[var(--border)] rounded-card shadow-popup py-1 min-w-32 animate-scale-in"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop
      >
        <!-- List Actions -->
        <template v-if="contextMenu.listId">
          <button class="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" @click="startRenameList(contextMenu.listId)">
            <Pencil :size="14" class="text-[var(--text-secondary)]" />
            重命名
          </button>
          <button class="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-red-500" @click="confirmDeleteList(contextMenu.listId)">
            <Trash2 :size="14" />
            删除清单
          </button>
        </template>
        <!-- Task Actions -->
        <template v-if="contextMenu.taskId">
          <button class="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" @click="openTaskDetail(contextMenu.taskId); closeContextMenu()">
            <Pencil :size="14" class="text-[var(--text-secondary)]" />
            编辑详情
          </button>
          <button class="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-red-500" @click="confirmDeleteTask(contextMenu.taskId)">
            <Trash2 :size="14" />
            删除任务
          </button>
        </template>
      </div>

      <!-- Backdrop for context menu -->
      <div v-if="contextMenu.show" class="fixed inset-0 z-40" @click="closeContextMenu" />
    </Teleport>

    <!-- Delete Confirmation -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" @click.self="showDeleteConfirm = false">
        <div class="card w-full max-w-xs mx-4 p-5 animate-scale-in">
          <h3 class="font-semibold mb-2">删除清单</h3>
          <p class="text-sm text-[var(--text-secondary)] mb-4">
            确定要删除清单"{{ taskStore.lists.find(l => l.id === deletingListId)?.name }}"吗？清单中的任务将移至 Inbox。
          </p>
          <div class="flex justify-end gap-2">
            <button class="btn-secondary text-sm" @click="showDeleteConfirm = false; deletingListId = null">取消</button>
            <button class="btn-danger text-sm" @click="executeDeleteList">删除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Task Delete Confirmation -->
    <Teleport to="body">
      <div v-if="showDeleteTaskConfirm" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" @click.self="showDeleteTaskConfirm = false">
        <div class="card w-full max-w-xs mx-4 p-5 animate-scale-in">
          <h3 class="font-semibold mb-2">删除任务</h3>
          <p class="text-sm text-[var(--text-secondary)] mb-4">
            确定要删除任务"{{ taskStore.tasks.find(t => t.id === deletingTaskId)?.title }}"吗？此操作不可恢复。
          </p>
          <div class="flex justify-end gap-2">
            <button class="btn-secondary text-sm" @click="showDeleteTaskConfirm = false; deletingTaskId = null">取消</button>
            <button class="btn-danger text-sm" @click="executeDeleteTask">删除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>