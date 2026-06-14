import { resolve } from 'node:path'

export function getPreloadPath(appRoot: string): string {
	return resolve(appRoot, 'out/preload/index.mjs')
}
