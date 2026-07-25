<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCountdownStore } from '@/stores/countdownStore'
import { Plus, Trash2, Clock } from 'lucide-vue-next'
import { differenceInDays, parseISO } from 'date-fns'

const countdownStore = useCountdownStore()
const showNew = ref(false)
const newTitle = ref('')
const newDate = ref('')
const newType = ref<'custom' | 'birthday' | 'anniversary' | 'exam' | 'event'>('custom')

function getDaysLeft(targetDate: string): number {
  return differenceInDays(parseISO(targetDate), new Date())
}

function formatDaysLabel(days: number): string {
  if (days > 0) return `还有 ${days} 天`
  if (days === 0) return '今天'
  return `已过 ${Math.abs(days)} 天`
}

async function addCountdown() {
  if (!newTitle.value.trim() || !newDate.value) return
  await countdownStore.addCountdown(newTitle.value.trim(), newDate.value, newType.value)
  newTitle.value = ''
  newDate.value = ''
  showNew.value = false
}

async function deleteCountdown(id: string) {
  await countdownStore.deleteCountdown(id)
}
</script>

<template>
  <div class="h-full overflow-y-auto bg-white dark:bg-[var(--bg-card)] p-4">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold">倒数纪念日</h2>
      <button class="btn-primary text-sm" @click="showNew = true">
        <Plus :size="16" />
        新建倒数日
      </button>
    </div>

    <div v-if="showNew" class="card p-4 mb-4 animate-slide-down space-y-3">
      <input v-model="newTitle" type="text" class="input" placeholder="名称..." />
      <input v-model="newDate" type="date" class="input" />
      <div class="flex justify-end gap-2">
        <button class="btn-secondary text-sm" @click="showNew = false">取消</button>
        <button class="btn-primary text-sm" @click="addCountdown">创建</button>
      </div>
    </div>

    <div v-if="countdownStore.countdowns.length === 0" class="text-center py-16 text-[var(--text-secondary)]">
      <Clock :size="48" class="mx-auto mb-3 opacity-30" />
      <p class="text-sm">还没有倒数日</p>
    </div>

    <div class="space-y-3">
      <div
        v-for="cd in countdownStore.countdowns"
        :key="cd.id"
        class="card p-4 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center" :style="{ backgroundColor: cd.color + '15', color: cd.color }">
            <Clock :size="18" />
          </div>
          <div>
            <div class="text-sm font-medium">{{ cd.title }}</div>
            <div class="text-xs text-[var(--text-secondary)]">{{ cd.targetDate }}</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-lg font-bold" :style="{ color: cd.color }">
            {{ formatDaysLabel(getDaysLeft(cd.targetDate)) }}
          </span>
          <button class="btn-ghost p-1" @click="deleteCountdown(cd.id)">
            <Trash2 :size="14" class="text-gray-400 hover:text-red-500" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>