export type Hunk = { before: string; after: string }

export type FileChange = {
  path: string
  added: number
  removed: number
  edits: number
  isNew: boolean
  hunks: Hunk[]
}

declare module 'claude-code' {
  interface PluginState {
    'session-diff': { files: FileChange[]; selected: string | null; page: number }
  }
}
