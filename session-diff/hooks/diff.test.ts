import { expect, test } from 'claude-code/testing'

import { fit, lineCount, MAX_HUNKS, record, shortPath, unified } from './diff'

test('line counts ignore a trailing newline', () => {
  expect(lineCount('')).toBe(0)
  expect(lineCount('a')).toBe(1)
  expect(lineCount('a\nb\n')).toBe(2)
})

test('edits add up per file, latest file first', () => {
  let files = record([], 'a.cs', { before: 'x', after: 'y\nz' }, false)
  files = record(files, 'b.cs', { before: '', after: 'new' }, true)
  files = record(files, 'a.cs', { before: 'q\nr', after: '' }, false)
  expect(files.map(f => f.path)).toEqual(['a.cs', 'b.cs'])
  expect(files[0]).toMatchObject({ added: 2, removed: 3, edits: 2, isNew: false })
  expect(files[1]).toMatchObject({ added: 1, removed: 0, isNew: true })
})

test('hunks are capped', () => {
  let files = record([], 'a.cs', { before: 'a', after: 'b' }, false)
  for (let i = 0; i < MAX_HUNKS + 5; i++) files = record(files, 'a.cs', { before: 'a', after: 'b' }, false)
  expect(files[0]?.hunks.length).toBe(MAX_HUNKS)
})

test('unified diff has a header per hunk', () => {
  const [file] = record([], 'a.cs', { before: 'old', after: 'new1\nnew2' }, false)
  expect(unified(file!)).toBe('--- a/a.cs\n+++ b/a.cs\n@@ -1,1 +1,2 @@\n-old\n+new1\n+new2')
  const [created] = record([], 'n.cs', { before: '', after: 'x' }, true)
  expect(unified(created!)).toContain('@@ -0,0 +1,1 @@')
})

test('paths are shown relative to the working directory', () => {
  expect(shortPath('D:\\Dev\\App\\src\\a.cs', 'D:\\Dev\\App')).toBe('src/a.cs')
  expect(shortPath('C:\\other\\b.cs', 'D:\\Dev\\App')).toBe('C:/other/b.cs')
  expect(fit('abcdefghij', 5)).toBe('…ghij')
})
