import type {
	AccountConfigInput,
	GitHubTokenInput,
	LauncherApi,
	LauncherSettingsPatch,
	WtfBackupActionInput
} from '@shared/contracts'

function getLauncher(): LauncherApi {
	if (!window.launcher) {
		throw new Error(
			'Electron preload API не доступен. Перезапусти dev-режим через npm run dev и открывай именно окно Electron.'
		)
	}

	return window.launcher
}

export const launcherApi = {
	app: {
		getInfo: () => getLauncher().app.getInfo()
	},
	github: {
		getTokenStatus: () => getLauncher().github.getTokenStatus(),
		saveToken: (input: GitHubTokenInput) => getLauncher().github.saveToken(input),
		clearToken: () => getLauncher().github.clearToken()
	},
	settings: {
		get: () => getLauncher().settings.get(),
		save: (patch: LauncherSettingsPatch) => getLauncher().settings.save(patch),
		selectWowPath: () => getLauncher().settings.selectWowPath()
	},
	backup: {
		listWtf: () => getLauncher().backup.listWtf(),
		createWtf: () => getLauncher().backup.createWtf(),
		restoreWtf: (input: WtfBackupActionInput) => getLauncher().backup.restoreWtf(input),
		deleteWtf: (input: WtfBackupActionInput) => getLauncher().backup.deleteWtf(input),
		openWtfFolder: () => getLauncher().backup.openWtfFolder()
	},
	fpsPatch: {
		getStatus: () => getLauncher().fpsPatch.getStatus(),
		install: () => getLauncher().fpsPatch.install()
	},
	client: {
		check: () => getLauncher().client.check()
	},
	wow: {
		validatePath: (wowPath: string) => getLauncher().wow.validatePath(wowPath),
		previewAccountConfig: (input: AccountConfigInput) =>
			getLauncher().wow.previewAccountConfig(input)
	}
}
