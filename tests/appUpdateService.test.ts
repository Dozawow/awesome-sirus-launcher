import { describe, expect, it } from 'vitest'
import { createAppUpdateService, appReleasesUrl } from '../src/main/updater/appUpdateService'
import type { LauncherSettings } from '../src/shared/contracts'

describe('app update service', () => {
	it('checks GitHub releases from the configured repository', async () => {
		const requestedUrls: string[] = []
		const service = createAppUpdateService('1.0.0', createSettingsStore(false), async (url) => {
			requestedUrls.push(url)
			return [
				{
					tag_name: 'v1.1.0',
					html_url: 'https://github.com/fxpw/awesome-sirus-launcher/releases/tag/v1.1.0',
					body: 'Notes',
					prerelease: false,
					assets: [
						{
							name: 'Awesome Sirus Launcher Setup 1.1.0.exe',
							browser_download_url: 'https://example.test/setup.exe',
							size: 100
						}
					]
				}
			]
		})

		const result = await service.check()

		expect(requestedUrls).toEqual([appReleasesUrl])
		expect(result.updateAvailable).toBe(true)
		expect(result.latest?.version).toBe('1.1.0')
		expect(result.latest?.assets[0]?.downloadUrl).toBe('https://example.test/setup.exe')
	})

	it('uses the prerelease setting when checking releases', async () => {
		const service = createAppUpdateService('1.0.0', createSettingsStore(true), async () => [
			{
				tag_name: 'v2.0.0',
				html_url: 'https://github.com/fxpw/awesome-sirus-launcher/releases/tag/v2.0.0',
				body: null,
				prerelease: true,
				assets: []
			}
		])

		const result = await service.check()

		expect(result.updateAvailable).toBe(true)
		expect(result.latest?.version).toBe('2.0.0')
	})
})

function createSettingsStore(allowPrereleaseUpdates: boolean) {
	const settings: LauncherSettings = {
		wowPath: '',
		closeOnLaunch: false,
		checkClientBeforeLaunch: false,
		autoUpdateAddons: false,
		allowPrereleaseUpdates
	}

	return {
		get: async () => settings,
		save: async () => settings
	}
}
