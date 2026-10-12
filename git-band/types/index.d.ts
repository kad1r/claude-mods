export type GitInfo = { branch: string; changed: number; ahead: number; behind: number; hasUpstream: boolean }

declare module 'claude-code' {
  interface PluginState {
    'git-band': { info: GitInfo | null }
  }
}
