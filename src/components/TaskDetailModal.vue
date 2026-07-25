<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { X, Calendar, Tag, Star, Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{ taskId: string | null }>()
const emit = defineEmits<{ close: [] }>()

const taskStore = useTaskStore()

const selected = computed(() => {
  if (!props.taskId) return null
  return taskStore.tasks.find(t => t.id === props.taskId) || null
})

const localTitle = ref('')
const localDescription = ref('')
const localDueDate = ref('')
const localPriority = ref<'high' | 'medium' | 'low' | 'none'>('none')
const localImportant = ref(false)
const localUrgent = ref(false)
const localTagIds = ref<string[]>([])
const showTagPicker = ref(false)

watch(() => props.taskId, (id) => {
  if (!id) return
  const task = taskStore.tasks.find(t => t.id === id)
  if (!task) return
  localTitle.value = task.title
  localDescription.value = task.description
  localDueDate.value = task.dueDate ? task.dueDate.slice(0, 16) : ''
  localPriority.value = task.priority
  localImportant.value = task.isImportant
  localUrgent.value = task.isUrgent
  localTagIds.value = [...task.tagIds]
}, { immediate: true })

async function saveField(field: string, value: any) {
  if (!selected.value) return
  await taskStore.updateTask(selected.value.id, { [field]: value })
}

async function handleTitleBlur() {
  if (localTitle.value.trim() && selected.value) {
    await saveField('title', localTitle.value.trim())
  }
}

async function handleDescriptionBlur() {
  if (selected.value) {
    await saveField('description', localDescription.value)
  }
}

async function handleDueDateChange() {
  if (!selected.value) return
  const val = localDueDate.value ? new Date(localDueDate.value).toISOString() : null
  await saveField('dueDate', val)
}

async function handlePriorityChange(p: 'high' | 'medium' | 'low' | 'none') {
  localPriority.value = p
  await saveField('priority', p)
}

async function toggleImportant() {
  localImportant.value = !localImportant.value
  await saveField('isImportant', localImportant.value)
}

async function toggleUrgent() {
  localUrgent.value = !localUrgent.value
  await saveField('isUrgent', localUrgent.value)
}

async function toggleTag(tagId: string) {
  const idx = localTagIds.value.indexOf(tagId)
  if (idx >= 0) localTagIds.value.splice(idx, 1)
  else localTagIds.value.push(tagId)
  await saveField('tagIds', localTagIds.value)
}

async function toggleComplete() {
  if (!selected.value) return
  await taskStore.toggleTask(selected.value.id)
  emit('close')
}

async function deleteTask() {
  if (!selected.value) return
  await taskStore.deleteTask(selected.value.id)
  emit('close')
}

function formatDateLabel(dateStr: string | null): string {
  if (!dateStr) return '未设置'
  const d = parseISO(dateStr)
  if (isToday(d)) return `今天 ${format(d, 'HH:mm')}`
  if (isTomorrow(d)) return `明天 ${format(d, 'HH:mm')}`
  return format(d, 'MM月dd日 HH:mm')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="selected"
      class="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      @click.self="emit('close')"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40 animate-fade-in" />

      <!-- Modal -->
      <div class="relative w-full md:max-w-lg md:mx-4 bg-white dark:bg-[var(--bg-card)] rounded-t-2xl md:rounded-2xl shadow-popup animate-slide-up max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
          <button
            class="shrink-0"
            @click="toggleComplete"
          >
            <CheckCircle2 v-if="selected.isCompleted" :size="22" class="text-green-500" />
            <Circle v-else :size="22" class="text-gray-300 hover:text-primary-500" />
          </button>
          <input
            v-model="localTitle"
            class="flex-1 text-base font-medium bg-transparent border-none outline-none"
            :class="{ 'line-through text-[var(--text-secondary)]': selected.isCompleted }"
            @blur="handleTitleBlur"
          />
          <button class="btn-ghost p-1" @click="deleteTask">
            <Trash2 :size="18" class="text-gray-400 hover:text-red-500" />
          </button>
          <button class="btn-ghost p-1" @click="emit('close')">
            <X :size="20" />
          </button>
        </div>

        <div class="px-5 py-4 space-y-5">
          <!-- Priority -->
          <div>
            <label class="text-xs text-[var(--text-secondary)] mb-2 block">优先级</label>
            <div class="flex gap-1.5">
              <button
                v-for="p in [{k:'high' as const,l:'高',c:'text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200'},{k:'medium' as const,l:'中',c:'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200'},{k:'low' as const,l:'低',c:'text-green-500 bg-green-50 dark:bg-green-500/10 border-green-200'},{k:'none' as const,l:'无',c:'text-gray-500 bg-gray-50 dark:bg-gray-500/10 border-gray-200'}]"
                :key="p.k"
                class="px-3 py-1.5 text-xs rounded-full border transition-all"
                :class="[localPriority === p.k ? p.c + ' font-medium' : 'border-[var(--border)] text-[var(--text-secondary)]']"
                @click="handlePriorityChange(p.k)"
              >
                {{ p.l }}
              </button>
            </div>
          </div>

          <!-- Due Date -->
          <div>
            <label class="text-xs text-[var(--text-secondary)] mb-2 flex items-center gap-1">
              <Calendar :size="12" /> 截止日期
            </label>
            <input
              v-model="localDueDate"
              type="datetime-local"
              class="input text-sm"
              @change="handleDueDateChange"
            />
          </div>

          <!-- Important & Urgent -->
          <div class="flex gap-4">
            <button
              class="flex-1 flex items-center justify-between px-3 py-2 rounded-btn border transition-all"
              :class="localImportant ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-500/10' : 'border-[var(--border)]'"
              @click="toggleImportant"
            >
              <span class="text-sm flex items-center gap-1.5">
                <Star :size="14" :class="localImportant ? 'text-yellow-500' : 'text-gray-400'" :fill="localImportant ? 'currentColor' : 'none'" />
                重要
              </span>
              <div class="w-9 h-5 rounded-full transition-colors relative" :class="localImportant ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'">
                <div class="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform" :class="localImportant ? 'translate-x-4' : 'translate-x-0.5'" />
              </div>
            </button>
            <button
              class="flex-1 flex items-center justify-between px-3 py-2 rounded-btn border transition-all"
              :class="localUrgent ? 'border-red-400 bg-red-50 dark:bg-red-500/10' : 'border-[var(--border)]'"
              @click="toggleUrgent"
            >
              <span class="text-sm flex items-center gap-1.5">
                <AlertCircle :size="14" :class="localUrgent ? 'text-red-500' : 'text-gray-400'" />
                紧急
              </span>
              <div class="w-9 h-5 rounded-full transition-colors relative" :class="localUrgent ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'">
                <div class="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform" :class="localUrgent ? 'translate-x-4' : 'translate-x-0.5'" />
              </div>
            </button>
          </div>

          <!-- Tags -->
          <div>
            <label class="text-xs text-[var(--text-secondary)] mb-2 flex items-center gap-1">
              <Tag :size="12" /> 标签
            </label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="tag in taskStore.tags"
                :key="tag.id"
                class="px-2.5 py-1 text-xs rounded-full border transition-all"
                :class="localTagIds.includes(tag.id) ? 'font-medium' : 'border-[var(--border)] text-[var(--text-secondary)]'"
                :style="localTagIds.includes(tag.id) ? { color: tag.color, backgroundColor: tag.color + '15', borderColor: tag.color + '40' } : {}"
                @click="toggleTag(tag.id)"
              >
                {{ tag.name }}
              </button>
              <button v-if="taskStore.tags.length === 0" class="text-xs text-[var(--text-secondary)]">
                暂无标签，请在设置中创建
              </button>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="text-xs text-[var(--text-secondary)] mb-2 block">描述</label>
            <textarea
              v-model="localDescription"
              class="input text-sm h-28 resize-none"
              placeholder="添加描述..."
              @blur="handleDescriptionBlur"
            />
          </div>

          <!-- Meta info -->
          <div class="text-xs text-[var(--text-secondary)] space-y-1 pt-2 border-t border-[var(--border)]">
            <div>创建于 {{ format(parseISO(selected.createdAt), 'yyyy-MM-dd HH:mm') }}</div>
            <div v-if="selected.updatedAt !== selected.createdAt">更新于 {{ format(parseISO(selected.updatedAt), 'yyyy-MM-dd HH:mm') }}</div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>