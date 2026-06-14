import { copyFile, mkdir, rename, rm, stat } from 'node:fs/promises'
import type { Stats } from 'node:fs'
import { dirname, join } from 'node:path'
import type { FpsPatchDeleteResult, FpsPatchInstallResult, FpsPatchStatus } from '@shared/contracts'
import { createFpsPatchInstallPlan, fpsPatchSourceUrls } from '../../core/fpsPatch/fpsPatch'
import type { SettingsStore } from '@main/settings/fileSettingsStore'

export type DownloadFile = (url: string, targetPath: string) => Promise<void>

export interface FpsPatchFileSystem {
	copyFile(sourcePath: string, targetPath: string): Promise<void>
	mkdir(path: string, options: { recursive: true }): Promise<unknown>
	rename(sourcePath: string, targetPath: string): Promise<void>
	rm(path: string, options: { force?: boolean; recursive?: boolean }): Promise<void>
	stat(path: string): Promise<Stats>
}

const defaultFileSystem: FpsPatchFileSystem = {
	copyFile,
	mkdir,
	rename,
	rm,
	stat
}

export interface FpsPatchService {
	getStatus(): Promise<FpsPatchStatus>
	install(): Promise<FpsPatchInstallResult>
	delete(): Promise<FpsPatchDeleteResult>
}

export function createFpsPatchService(
	getUserDataPath: () => string,
	settingsStore: SettingsStore,
	downloadFile: DownloadFile,
	fileSystem: FpsPatchFileSystem = defaultFileSystem
): FpsPatchService {
	const getTempDir = () => join(getUserDataPath(), 'downloads', 'fps-patch')

	return {
		async getStatus() {
			const settings = await settingsStore.get()
			if (!settings.wowPath) return createMissingStatus('')

			const plan = createFpsPatchInstallPlan(settings.wowPath, getTempDir())
			return readFpsPatchStatus(plan.targetPath, fileSystem)
		},
		async install() {
			const settings = await settingsStore.get()
			if (!settings.wowPath) throw new Error('Сначала выберите папку WoW')

			const plan = createFpsPatchInstallPlan(settings.wowPath, getTempDir())
			await fileSystem.mkdir(dirname(plan.targetPath), { recursive: true })
			await fileSystem.mkdir(dirname(plan.tempPath), { recursive: true })
			await fileSystem.rm(plan.tempPath, { force: true })

			const sourceUrl = await downloadWithFallback(
				plan.sourceUrls,
				plan.tempPath,
				downloadFile,
				fileSystem
			)
			await fileSystem.rm(plan.targetPath, { force: true })
			await moveDownloadedFile(plan.tempPath, plan.targetPath, fileSystem)

			return {
				status: await readFpsPatchStatus(plan.targetPath, fileSystem),
				sourceUrl
			}
		},
		async delete() {
			const settings = await settingsStore.get()
			if (!settings.wowPath) throw new Error('Сначала выберите папку WoW')

			const plan = createFpsPatchInstallPlan(settings.wowPath, getTempDir())
			await fileSystem.rm(plan.targetPath, { force: true })

			return {
				status: await readFpsPatchStatus(plan.targetPath, fileSystem),
				deleted: true
			}
		}
	}
}

async function moveDownloadedFile(
	sourcePath: string,
	targetPath: string,
	fileSystem: FpsPatchFileSystem
): Promise<void> {
	try {
		await fileSystem.rename(sourcePath, targetPath)
	} catch (error) {
		if (!isCrossDeviceRenameError(error)) throw error

		await fileSystem.copyFile(sourcePath, targetPath)
		await fileSystem.rm(sourcePath, { force: true })
	}
}

function isCrossDeviceRenameError(error: unknown): boolean {
	return Boolean(
		error &&
		typeof error === 'object' &&
		'code' in error &&
		(error as NodeJS.ErrnoException).code === 'EXDEV'
	)
}

async function readFpsPatchStatus(
	patchPath: string,
	fileSystem: FpsPatchFileSystem
): Promise<FpsPatchStatus> {
	try {
		const patchStat = await fileSystem.stat(patchPath)

		return {
			installed: patchStat.isFile(),
			patchPath,
			size: patchStat.size,
			updatedAt: patchStat.mtime.toISOString(),
			sourceUrls: [...fpsPatchSourceUrls]
		}
	} catch {
		return createMissingStatus(patchPath)
	}
}

function createMissingStatus(patchPath: string): FpsPatchStatus {
	return {
		installed: false,
		patchPath,
		sourceUrls: [...fpsPatchSourceUrls]
	}
}

async function downloadWithFallback(
	sourceUrls: string[],
	tempPath: string,
	downloadFile: DownloadFile,
	fileSystem: FpsPatchFileSystem
): Promise<string> {
	const errors: string[] = []

	for (const sourceUrl of sourceUrls) {
		try {
			await downloadFile(sourceUrl, tempPath)
			return sourceUrl
		} catch (error) {
			await fileSystem.rm(tempPath, { force: true })
			errors.push(error instanceof Error ? error.message : String(error))
		}
	}

	throw new Error(`Не удалось скачать FPS-патч: ${errors.join('; ')}`)
}
