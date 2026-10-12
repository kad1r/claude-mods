export type AgentRow = {
  id: string
  type: string
  description: string
  status: string
  startedAt: number
  endedAt?: number
}

declare module 'claude-code' {
  interface PluginState {
    'agents-pane': { agents: AgentRow[]; now: number }
  }
}
