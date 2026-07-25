import { defineStore } from 'pinia'
import { ref } from 'vue'
import { v4 as uuid } from 'uuid'
import { db } from '@/db/database'
import type { Task, TaskList, Folder, Tag, Filter } from '@/types'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  const lists = ref<TaskList[]>([])
  const folders = ref<Folder[]>([])
  const tags = ref<Tag[]>([])
  const filters = ref<Filter[]>([])

  // --- Tasks ---
  async function loadTasks() {
    try {
      tasks.value = await db.tasks.orderBy('sortOrder').toArray()
    } catch (e) {
      console.error('loadTasks failed:', e)
    }
  }

  async function addTask(title: string, listId: string = 'inbox'): Promise<Task> {
    const task: Task = {
      id: uuid(),
      title,
      description: '',
      listId,
      tagIds: [],
      priority: 'none',
      dueDate: null,
      startDate: null,
      repeatRule: 'none',
      repeatCustom: null,
      isCompleted: false,
      completedAt: null,
      isImportant: false,
      isUrgent: false,
      estimatedPomodoros: 0,
      sortOrder: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    // Optimistic: push to array first, then save to DB
    tasks.value.push(task)
    try {
      await db.tasks.put(task)
    } catch (e) {
      console.error('addTask db failed:', e)
    }
    return task
  }

  async function updateTask(id: string, updates: Partial<Task>) {
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx === -1) return
    const updated = { ...tasks.value[idx], ...updates, updatedAt: new Date().toISOString() }
    // Optimistic: update array directly
    tasks.value[idx] = updated
    try {
      await db.tasks.put(updated)
    } catch (e) {
      console.error('updateTask db failed:', e)
    }
  }

  async function deleteTask(id: string) {
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx !== -1) tasks.value.splice(idx, 1)
    try {
      await db.tasks.delete(id)
      await db.checkItems.where('taskId').equals(id).delete()
      await db.attachments.where('taskId').equals(id).delete()
      await db.activities.where('taskId').equals(id).delete()
      await db.reminders.where('taskId').equals(id).delete()
    } catch (e) {
      console.error('deleteTask db failed:', e)
    }
  }

  async function toggleTask(id: string) {
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx === -1) return
    const task = tasks.value[idx]
    const now = new Date().toISOString()
    const updated = {
      ...task,
      isCompleted: !task.isCompleted,
      completedAt: !task.isCompleted ? now : null,
      updatedAt: now
    }
    // Optimistic: update array directly
    tasks.value[idx] = updated
    try {
      await db.tasks.put(updated)
    } catch (e) {
      console.error('toggleTask db failed:', e)
    }
  }

  function getTasksByList(listId: string): Task[] {
    return tasks.value.filter(t => t.listId === listId && !t.isCompleted)
  }

  function getTasksByTag(tagId: string): Task[] {
    return tasks.value.filter(t => t.tagIds.includes(tagId))
  }

  // --- Lists ---
  async function loadLists() {
    lists.value = await db.lists.orderBy('sortOrder').toArray()
  }

  async function addList(name: string, color: string = '#4772FA'): Promise<TaskList> {
    const list: TaskList = {
      id: uuid(),
      name,
      color,
      background: '',
      folderId: null,
      isArchived: false,
      sortOrder: lists.value.length,
      createdAt: new Date().toISOString()
    }
    await db.lists.put(list)
    await loadLists()
    return list
  }

  async function updateList(id: string, updates: Partial<TaskList>) {
    const list = lists.value.find(l => l.id === id)
    if (!list) return
    await db.lists.put({ ...list, ...updates })
    await loadLists()
  }

  async function deleteList(id: string) {
    await db.lists.delete(id)
    await db.tasks.where('listId').equals(id).modify({ listId: 'inbox' })
    await loadLists()
  }

  // --- Tags ---
  async function loadTags() {
    tags.value = await db.tags.toArray()
  }

  async function addTag(name: string, color: string = '#3B82F6'): Promise<Tag> {
    const tag: Tag = { id: uuid(), name, color }
    await db.tags.put(tag)
    await loadTags()
    return tag
  }

  async function deleteTag(id: string) {
    await db.tags.delete(id)
    for (const task of tasks.value) {
      if (task.tagIds.includes(id)) {
        const newTagIds = task.tagIds.filter(tid => tid !== id)
        await db.tasks.update(task.id, { tagIds: newTagIds, updatedAt: new Date().toISOString() })
      }
    }
    await loadTags()
    await loadTasks()
  }

  // --- Filters ---
  async function loadFilters() {
    filters.value = await db.filters.toArray()
  }

  async function addFilter(filter: Omit<Filter, 'id'>): Promise<Filter> {
    const f: Filter = { ...filter, id: uuid() }
    await db.filters.put(f)
    await loadFilters()
    return f
  }

  async function deleteFilter(id: string) {
    await db.filters.delete(id)
    await loadFilters()
  }

  // --- Folders ---
  async function loadFolders() {
    folders.value = await db.folders.orderBy('sortOrder').toArray()
  }

  async function addFolder(name: string): Promise<Folder> {
    const folder: Folder = { id: uuid(), name, sortOrder: folders.value.length }
    await db.folders.put(folder)
    await loadFolders()
    return folder
  }

  async function deleteFolder(id: string) {
    await db.folders.delete(id)
    await db.lists.where('folderId').equals(id).modify({ folderId: null })
    await loadFolders()
    await loadLists()
  }

  return {
    tasks, lists, folders, tags, filters,
    loadTasks, loadLists, loadTags, loadFilters, loadFolders,
    addTask, updateTask, deleteTask, toggleTask,
    getTasksByList, getTasksByTag,
    addList, updateList, deleteList,
    addTag, deleteTag,
    addFilter, deleteFilter,
    addFolder, deleteFolder
  }
})