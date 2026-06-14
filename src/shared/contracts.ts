export const ipcChannels = {
	app: {
		getInfo: 'app:get-info',
		checkUpdate: 'app:check-update'
	},
	github: {
		getTokenStatus: 'github:get-token-status',
		saveToken: 'github:save-token',
		clearToken: 'github:clear-token'
	},
	settings: {
		get: 'settings:get',
		save: 'settings:save',
		selectWowPath: 'settings:select-wow-path'
	},
	backup: {
		listWtf: 'backup:list-wtf',
		createWtf: 'backup:create-wtf',
		restoreWtf: 'backup:restore-wtf',
		deleteWtf: 'backup:delete-wtf',
		openWtfFolder: 'backup:open-wtf-folder'
	},
	accounts: {
		list: 'accounts:list',
		add: 'accounts:add',
		select: 'accounts:select'
	},
	fpsPatch: {
		getStatus: 'fps-patch:get-status',
		install: 'fps-patch:install',
		delete: 'fps-patch:delete'
	},
	client: {
		list: 'client:list',
		check: 'client:check',
		downloadFile: 'client:download-file',
		downloadMissing: 'client:download-missing'
	},
	wow: {
		validatePath: 'wow:validate-path',
		previewAccountConfig: 'wow:preview-account-config',
		launchGame: 'wow:launch-game'
	}
} as const

export const clientPatchSourceUrls = [
	'https://s-patches.pro/api/client/patches',
	'https://s-patches.ru/api/client/patches',
	'https://sirus.world/api/client/patches'
] as const

export interface AppInfo {
	name: string
	version: string
}

export interface GitHubTokenStatus {
	configured: boolean
}

export interface GitHubRateLimit {
	limit?: number
	remaining?: number
	resetAt?: string
}

export interface GitHubTokenInput {
	token: string
}

export interface LauncherSettings {
	wowPath: string
	closeOnLaunch: boolean
	checkClientBeforeLaunch: boolean
	allowPrereleaseUpdates: boolean
}

export type LauncherSettingsPatch = Partial<LauncherSettings>

export interface WowPathValidation {
	wowPath: string
	valid: boolean
	executablePath: string
	dataPath: string
	localeDataPath: string
	interfacePath: string
	addonsPath: string
	wtfPath: string
	configWtfPath: string
	missing: string[]
}

export interface AccountConfigInput {
	configText: string
	login: string
	password: string
}

export interface AccountConfigPreview {
	changed: boolean
	text: string
	touchedKeys: string[]
}

export interface AccountSummary {
	id: string
	login: string
}

export interface AccountListResult {
	accounts: AccountSummary[]
	selectedAccountId?: string
}

export interface AddAccountInput {
	login: string
	password: string
}

export interface SelectAccountInput {
	accountId: string
}

export interface ReleaseAsset {
	name: string
	downloadUrl: string
	size?: number
}

export interface AppRelease {
	version: string
	url: string
	notes?: string
	prerelease: boolean
	assets: ReleaseAsset[]
}

export interface AppUpdateCheck {
	currentVersion: string
	latest?: AppRelease
	updateAvailable: boolean
}

export interface WtfBackupSummary {
	id: string
	fileName: string
	archivePath: string
	size: number
	createdAt: string
}

export interface CreateWtfBackupResult {
	backup: WtfBackupSummary
}

export interface WtfBackupActionInput {
	id: string
}

export interface RestoreWtfBackupResult {
	restored: WtfBackupSummary
	safetyBackup: WtfBackupSummary
}

export interface DeleteWtfBackupResult {
	deletedId: string
}

export interface FpsPatchStatus {
	installed: boolean
	patchPath: string
	size?: number
	updatedAt?: string
	sourceUrls: string[]
}

export interface FpsPatchInstallResult {
	status: FpsPatchStatus
	sourceUrl: string
}

export interface FpsPatchDeleteResult {
	status: FpsPatchStatus
	deleted: boolean
}

export interface GameLaunchResult {
	launchedAt: string
	executablePath: string
}

export type ClientPatchFileStatus = 'ok' | 'missing' | 'outdated'

export interface ClientPatchCheckFile {
	fileName: string
	relativePath: string
	targetPath: string
	expectedMd5: string
	actualMd5?: string
	expectedSize: number
	actualSize?: number
	downloadUrl: string
	status: ClientPatchFileStatus
}

export interface ClientPatchManifestFile {
	fileName: string
	relativePath: string
	targetPath: string
	expectedMd5: string
	expectedSize: number
	downloadUrl: string
	updatedAt?: string
}

export interface ClientPatchManifestResult {
	loadedAt: string
	sourceUrl: string
	availableSourceUrls: string[]
	total: number
	files: ClientPatchManifestFile[]
}

export interface ClientCheckResult {
	checkedAt: string
	sourceUrl: string
	availableSourceUrls: string[]
	total: number
	ok: number
	missing: number
	outdated: number
	files: ClientPatchCheckFile[]
}

export interface ClientPatchFileInput {
	fileName: string
	relativePath: string
	sourceUrl?: string
}

export interface ClientPatchSourceInput {
	sourceUrl?: string
}

export interface ClientPatchDownloadResult {
	downloadedAt: string
	file: ClientPatchCheckFile
}

export interface ClientPatchDownloadAllResult {
	downloadedAt: string
	total: number
	files: ClientPatchCheckFile[]
}

export interface LauncherApi {
	app: {
		getInfo(): Promise<AppInfo>
	}
	github: {
		getTokenStatus(): Promise<GitHubTokenStatus>
		saveToken(input: GitHubTokenInput): Promise<GitHubTokenStatus>
		clearToken(): Promise<GitHubTokenStatus>
	}
	settings: {
		get(): Promise<LauncherSettings>
		save(patch: LauncherSettingsPatch): Promise<LauncherSettings>
		selectWowPath(): Promise<LauncherSettings>
	}
	backup: {
		listWtf(): Promise<WtfBackupSummary[]>
		createWtf(): Promise<CreateWtfBackupResult>
		restoreWtf(input: WtfBackupActionInput): Promise<RestoreWtfBackupResult>
		deleteWtf(input: WtfBackupActionInput): Promise<DeleteWtfBackupResult>
		openWtfFolder(): Promise<void>
	}
	accounts: {
		list(): Promise<AccountListResult>
		add(input: AddAccountInput): Promise<AccountListResult>
		select(input: SelectAccountInput): Promise<AccountListResult>
	}
	fpsPatch: {
		getStatus(): Promise<FpsPatchStatus>
		install(): Promise<FpsPatchInstallResult>
		delete(): Promise<FpsPatchDeleteResult>
	}
	client: {
		list(input?: ClientPatchSourceInput): Promise<ClientPatchManifestResult>
		check(input?: ClientPatchSourceInput): Promise<ClientCheckResult>
		downloadFile(input: ClientPatchFileInput): Promise<ClientPatchDownloadResult>
		downloadMissing(input?: ClientPatchSourceInput): Promise<ClientPatchDownloadAllResult>
	}
	wow: {
		validatePath(wowPath: string): Promise<WowPathValidation>
		previewAccountConfig(input: AccountConfigInput): Promise<AccountConfigPreview>
		launchGame(): Promise<GameLaunchResult>
	}
}
