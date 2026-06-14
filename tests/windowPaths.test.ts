import { describe, expect, it } from 'vitest'
import { normalize } from 'node:path'
import { getPreloadPath } from '../src/main/windowPaths'

describe('window paths', () => {
	it('points BrowserWindow preload to the electron-vite ESM preload bundle from app root', () => {
		const preloadPath = normalize(getPreloadPath('D:/repo'))

		expect(preloadPath).toBe(normalize('D:/repo/out/preload/index.mjs'))
	})
})
