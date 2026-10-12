export type TodoStatus = 'pending' | 'in_progress' | 'completed'

export type Todo = { id: string; text: string; active: string; status: TodoStatus }

declare module 'claude-code' {
  interface PluginState {
    'todo-pane': { items: Todo[] }
  }
}
