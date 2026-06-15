import {
	checkForAppUpdate,
	mapGitHubRelease,
	type GitHubReleaseResponse
} from '../../core/updater/appUpdate'
import type { AppUpdateCheck } from '../../shared/contracts'
import type { SettingsStore } from '../settings/fileSettingsStore'

export const appReleasesUrl =
	'https://api.github.com/repos/fxpw/awesome-sirus-launcher/releases?per_page=20'

export function createAppUpdateService(
	currentVersion: string,
	settingsStore: SettingsStore,
	fetchJson: (url: string) => Promise<unknown>
): { check(): Promise<AppUpdateCheck> } {
	return {
		async check() {
			const [settings, payload] = await Promise.all([
				settingsStore.get(),
				fetchJson(appReleasesUrl)
			])
			if (!Array.isArray(payload))
				throw new Error('GitHub Releases response должен быть массивом')

			const releases = payload.map(toGitHubReleaseResponse).map(mapGitHubRelease)
			return checkForAppUpdate(currentVersion, releases, settings.allowPrereleaseUpdates)
		}
	}
}

function toGitHubReleaseResponse(value: unknown): GitHubReleaseResponse {
	if (!isRecord(value)) throw new Error('GitHub release должен быть объектом')
	const assets = Array.isArray(value.assets) ? value.assets.map(toGitHubReleaseAsset) : []

	return {
		tag_name: readString(value, 'tag_name'),
		html_url: readString(value, 'html_url'),
		body: typeof value.body === 'string' ? value.body : null,
		prerelease: value.prerelease === true,
		assets
	}
}

function toGitHubReleaseAsset(value: unknown): GitHubReleaseResponse['assets'][number] {
	if (!isRecord(value)) throw new Error('GitHub release asset должен быть объектом')

	const size = typeof value.size === 'number' ? value.size : undefined
	return {
		name: readString(value, 'name'),
		browser_download_url: readString(value, 'browser_download_url'),
		size
	}
}

function readString(record: Record<string, unknown>, key: string): string {
	const value = record[key]
	if (typeof value !== 'string')
		throw new Error(`GitHub release field ${key} должен быть строкой`)
	return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}
