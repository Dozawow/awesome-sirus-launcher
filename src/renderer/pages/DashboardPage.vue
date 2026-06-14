<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type {
	AppInfo,
	ClientCheckResult,
	ClientPatchFileInput,
	ClientPatchManifestResult,
	FpsPatchStatus,
	GitHubTokenStatus,
	LauncherSettings,
	WowPathValidation,
	WtfBackupSummary
} from '@shared/contracts'
import AddonsPanel from '@renderer/elements/AddonsPanel.vue'
import DashboardFooter from '@renderer/blocks/DashboardFooter.vue'
import AppSidebar from '@renderer/blocks/AppSidebar.vue'
import ClientCheckPanel from '@renderer/elements/ClientCheckPanel.vue'
import ClientPathModal from '@renderer/elements/ClientPathModal.vue'
import DashboardHeader from '@renderer/blocks/DashboardHeader.vue'
import DashboardOverviewPanel from '@renderer/elements/DashboardOverviewPanel.vue'
import FpsPatchPanel from '@renderer/elements/FpsPatchPanel.vue'
import GitHubTokenForm from '@renderer/elements/GitHubTokenForm.vue'
import GitHubTokenModal from '@renderer/elements/GitHubTokenModal.vue'
import LaunchBehaviorForm from '@renderer/elements/LaunchBehaviorForm.vue'
import WowPathForm from '@renderer/elements/WowPathForm.vue'
import WtfBackupPanel from '@renderer/elements/WtfBackupPanel.vue'
import { launcherApi } from '@renderer/api/launcherApi'
import { useLocale } from '@renderer/composables/useLocale'
import { useTheme } from '@renderer/composables/useTheme'
import type { MessageKey } from '@renderer/shared/i18n'

type LauncherSection = 'dashboard' | 'addons' | 'client' | 'patch' | 'wtf' | 'settings'

const sectionTitleKeys: Record<LauncherSection, MessageKey> = {
	dashboard: 'section.dashboard.title',
	addons: 'section.addons.title',
	client: 'section.client.title',
	patch: 'section.patch.title',
	wtf: 'section.wtf.title',
	settings: 'section.settings.title'
}

const sectionEyebrowKeys: Record<LauncherSection, MessageKey> = {
	dashboard: 'section.dashboard.eyebrow',
	addons: 'section.addons.eyebrow',
	client: 'section.client.eyebrow',
	patch: 'section.patch.eyebrow',
	wtf: 'section.wtf.eyebrow',
	settings: 'section.settings.eyebrow'
}

const appInfo = ref<AppInfo | null>(null)
const githubTokenStatus = ref<GitHubTokenStatus>({ configured: false })
const settings = ref<LauncherSettings | null>(null)
const wowPath = ref('')
const wowValidation = ref<WowPathValidation | null>(null)
const backups = ref<WtfBackupSummary[]>([])
const wtfBackupCreating = ref(false)
const fpsPatchStatus = ref<FpsPatchStatus | null>(null)
const fpsPatchInstalling = ref(false)
const gameLaunching = ref(false)
const clientCheckResult = ref<ClientCheckResult | null>(null)
const clientPatchManifest = ref<ClientPatchManifestResult | null>(null)
const clientChecking = ref(false)
const clientManifestLoading = ref(false)
const clientDownloadingKey = ref('')
const clientDownloadingAll = ref(false)
const githubToken = ref('')
const error = ref('')
const notice = ref('')
const tokenModalError = ref('')
const tokenModalOpen = ref(false)
const activeSection = ref<LauncherSection>('dashboard')

const { t } = useLocale()
useTheme()

const latestBackup = computed(() => backups.value[0] ?? null)
const activeTitle = computed(() => t(sectionTitleKeys[activeSection.value]))
const activeEyebrow = computed(() => t(sectionEyebrowKeys[activeSection.value]))
const clientProblemCount = computed(
	() => (clientCheckResult.value?.missing ?? 0) + (clientCheckResult.value?.outdated ?? 0)
)
const footerStatusTone = computed(() => {
	if (error.value) return 'error'
	if (clientProblemCount.value > 0) return 'warning'
	if (notice.value || clientCheckResult.value) return 'ok'
	return 'neutral'
})
const footerStatusText = computed(() => {
	if (error.value) return error.value
	if (clientDownloadingAll.value) {
		return t('footer.status.clientDownloadingAll', { count: clientProblemCount.value })
	}
	if (clientDownloadingKey.value) return t('footer.status.clientDownloadingOne')
	if (clientChecking.value) return t('footer.status.clientChecking')
	if (clientManifestLoading.value) return t('footer.status.clientManifest')
	if (fpsPatchInstalling.value) return t('footer.status.fpsPatch')
	if (gameLaunching.value) return t('footer.status.launchingGame')
	if (wtfBackupCreating.value) return t('footer.status.wtfBackup')
	if (notice.value) return notice.value
	if (clientCheckResult.value) {
		return clientProblemCount.value > 0
			? t('footer.status.clientProblems', {
					count: clientProblemCount.value,
					total: clientCheckResult.value.total
				})
			: t('footer.status.clientOk', { total: clientCheckResult.value.total })
	}

	return t('footer.status.idle')
})
const shouldShowClientPathModal = computed(
	() => settings.value !== null && settings.value.wowPath.trim().length === 0
)

onMounted(async () => {
	try {
		appInfo.value = await launcherApi.app.getInfo()
		githubTokenStatus.value = await launcherApi.github.getTokenStatus()
		settings.value = await launcherApi.settings.get()
		backups.value = await launcherApi.backup.listWtf()
		fpsPatchStatus.value = await launcherApi.fpsPatch.getStatus()
		wowPath.value = settings.value.wowPath
		if (wowPath.value) await validateWowPath()
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('app.initError')
	}
})

async function validateWowPath(): Promise<void> {
	error.value = ''
	try {
		wowValidation.value = await launcherApi.wow.validatePath(wowPath.value)
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('wow.validateError')
	}
}

async function selectWowPath(): Promise<void> {
	error.value = ''
	notice.value = ''
	try {
		settings.value = await launcherApi.settings.selectWowPath()
		wowPath.value = settings.value.wowPath
		fpsPatchStatus.value = await launcherApi.fpsPatch.getStatus()
		if (wowPath.value) await validateWowPath()
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('wow.selectError')
	}
}

async function saveWowPath(): Promise<void> {
	error.value = ''
	notice.value = ''
	try {
		settings.value = await launcherApi.settings.save({ wowPath: wowPath.value })
		wowPath.value = settings.value.wowPath
		await validateWowPath()
		fpsPatchStatus.value = await launcherApi.fpsPatch.getStatus()
		notice.value = t('wow.saved')
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('wow.saveError')
	}
}

async function toggleSetting(
	key: 'closeOnLaunch' | 'checkClientBeforeLaunch' | 'allowPrereleaseUpdates'
): Promise<void> {
	if (!settings.value) return
	settings.value = await launcherApi.settings.save({ [key]: !settings.value[key] })
}

async function saveGitHubToken(): Promise<void> {
	error.value = ''
	notice.value = ''
	tokenModalError.value = ''
	try {
		githubTokenStatus.value = await launcherApi.github.saveToken({ token: githubToken.value })
		githubToken.value = ''
		tokenModalOpen.value = false
		notice.value = t('token.saved')
	} catch (err) {
		const message = err instanceof Error ? err.message : t('token.saveError')
		if (tokenModalOpen.value) tokenModalError.value = message
		else error.value = message
	}
}

async function clearGitHubToken(): Promise<void> {
	error.value = ''
	notice.value = ''
	tokenModalError.value = ''
	try {
		githubTokenStatus.value = await launcherApi.github.clearToken()
		githubToken.value = ''
		tokenModalOpen.value = false
		notice.value = t('token.cleared')
	} catch (err) {
		const message = err instanceof Error ? err.message : t('token.clearError')
		if (tokenModalOpen.value) tokenModalError.value = message
		else error.value = message
	}
}

async function createWtfBackup(): Promise<void> {
	error.value = ''
	notice.value = ''
	wtfBackupCreating.value = true
	try {
		const result = await launcherApi.backup.createWtf()
		backups.value = [
			result.backup,
			...backups.value.filter((backup) => backup.id !== result.backup.id)
		]
		notice.value = t('backup.created')
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('backup.createError')
	} finally {
		wtfBackupCreating.value = false
	}
}

async function restoreWtfBackup(backup: WtfBackupSummary): Promise<void> {
	if (!confirm(t('backup.restoreConfirm', { name: backup.fileName }))) return

	error.value = ''
	notice.value = ''
	try {
		await launcherApi.backup.restoreWtf({ id: backup.id })
		backups.value = await launcherApi.backup.listWtf()
		notice.value = t('backup.restored')
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('backup.restoreError')
	}
}

async function deleteWtfBackup(backup: WtfBackupSummary): Promise<void> {
	if (!confirm(t('backup.deleteConfirm', { name: backup.fileName }))) return

	error.value = ''
	notice.value = ''
	try {
		const result = await launcherApi.backup.deleteWtf({ id: backup.id })
		backups.value = backups.value.filter((item) => item.id !== result.deletedId)
		notice.value = t('backup.deleted')
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('backup.deleteError')
	}
}

async function openWtfBackupFolder(): Promise<void> {
	error.value = ''
	try {
		await launcherApi.backup.openWtfFolder()
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('backup.openError')
	}
}

async function installFpsPatch(): Promise<void> {
	error.value = ''
	notice.value = ''
	fpsPatchInstalling.value = true
	try {
		const result = await launcherApi.fpsPatch.install()
		fpsPatchStatus.value = result.status
		notice.value = t('fpsPatch.installedNotice')
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('fpsPatch.installError')
	} finally {
		fpsPatchInstalling.value = false
	}
}

async function deleteFpsPatch(): Promise<void> {
	error.value = ''
	notice.value = ''
	fpsPatchInstalling.value = true
	try {
		const result = await launcherApi.fpsPatch.delete()
		fpsPatchStatus.value = result.status
		notice.value = t('fpsPatch.deletedNotice')
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('fpsPatch.deleteError')
	} finally {
		fpsPatchInstalling.value = false
	}
}

async function launchGame(): Promise<void> {
	error.value = ''
	notice.value = ''
	gameLaunching.value = true
	try {
		await launcherApi.wow.launchGame()
		notice.value = t('game.launched')
		if (settings.value?.closeOnLaunch) window.close()
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('game.launchError')
	} finally {
		gameLaunching.value = false
	}
}

async function checkClient(): Promise<void> {
	error.value = ''
	notice.value = ''
	clientChecking.value = true
	try {
		if (!clientPatchManifest.value) clientPatchManifest.value = await launcherApi.client.list()
		clientCheckResult.value = await launcherApi.client.check()
		notice.value = t('clientCheck.checked')
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('clientCheck.error')
	} finally {
		clientChecking.value = false
	}
}

async function loadClientManifest(): Promise<void> {
	error.value = ''
	notice.value = ''
	clientManifestLoading.value = true
	try {
		clientPatchManifest.value = await launcherApi.client.list()
		notice.value = t('clientCheck.loaded')
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('clientCheck.loadError')
	} finally {
		clientManifestLoading.value = false
	}
}

async function downloadClientFile(input: ClientPatchFileInput): Promise<void> {
	error.value = ''
	notice.value = ''
	clientDownloadingKey.value = createClientFileKey(input)
	try {
		await launcherApi.client.downloadFile(input)
		clientCheckResult.value = await launcherApi.client.check()
		notice.value = t('clientCheck.downloadedFile')
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('clientCheck.downloadError')
	} finally {
		clientDownloadingKey.value = ''
	}
}

async function downloadMissingClientFiles(): Promise<void> {
	error.value = ''
	notice.value = ''
	clientDownloadingAll.value = true
	try {
		const result = await launcherApi.client.downloadMissing()
		clientCheckResult.value = await launcherApi.client.check()
		notice.value = t('clientCheck.downloadedAll', { total: result.total })
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('clientCheck.downloadError')
	} finally {
		clientDownloadingAll.value = false
	}
}

function createClientFileKey(input: ClientPatchFileInput): string {
	return `${input.relativePath}\u0000${input.fileName}`
}

function navigate(section: string): void {
	activeSection.value = section as LauncherSection
	error.value = ''
	notice.value = ''
	if (activeSection.value === 'client' && !clientPatchManifest.value) {
		void loadClientManifest()
	}
}

function checkAddons(): void {
	navigate('addons')
	notice.value = t('footer.status.addonsSoon')
}
</script>

<template>
	<main class="shell">
		<DashboardHeader
			:github-token-status="githubTokenStatus"
			:title="activeTitle"
			:eyebrow="activeEyebrow"
			@open-token="tokenModalOpen = true"
		/>

		<AppSidebar :app-info="appInfo" :active-section="activeSection" @navigate="navigate" />

		<section class="workspace">
			<DashboardOverviewPanel
				v-if="activeSection === 'dashboard'"
				:wow-validation="wowValidation"
				:fps-patch-status="fpsPatchStatus"
				:client-check-result="clientCheckResult"
				:latest-backup="latestBackup"
				:addons-updated="null"
				:checking-client="clientChecking"
				:installing-fps-patch="fpsPatchInstalling"
				:creating-backup="wtfBackupCreating"
				:launching-game="gameLaunching"
				@select-wow-path="selectWowPath"
				@launch-game="launchGame"
				@install-fps-patch="installFpsPatch"
				@delete-fps-patch="deleteFpsPatch"
				@open-addons="checkAddons"
				@check-client="checkClient"
				@create-backup="createWtfBackup"
			/>

			<AddonsPanel v-else-if="activeSection === 'addons'" />

			<ClientCheckPanel
				v-else-if="activeSection === 'client'"
				:manifest="clientPatchManifest"
				:result="clientCheckResult"
				:checking="clientChecking"
				:loading-manifest="clientManifestLoading"
				:downloading-key="clientDownloadingKey"
				:downloading-all="clientDownloadingAll"
				@load="loadClientManifest"
				@check="checkClient"
				@download-file="downloadClientFile"
				@download-missing="downloadMissingClientFiles"
			/>

			<FpsPatchPanel
				v-else-if="activeSection === 'patch'"
				:status="fpsPatchStatus"
				:installing="fpsPatchInstalling"
				@install="installFpsPatch"
				@delete="deleteFpsPatch"
			/>

			<WtfBackupPanel
				v-else-if="activeSection === 'wtf'"
				:backups="backups"
				:creating="wtfBackupCreating"
				@create="createWtfBackup"
				@restore="restoreWtfBackup"
				@delete="deleteWtfBackup"
				@open-folder="openWtfBackupFolder"
			/>

			<template v-else>
				<WowPathForm
					v-model:wow-path="wowPath"
					:validation="wowValidation"
					:error="error"
					:notice="notice"
					@select="selectWowPath"
					@save="saveWowPath"
				/>

				<LaunchBehaviorForm v-if="settings" :settings="settings" @toggle="toggleSetting" />

				<GitHubTokenForm
					v-model:token="githubToken"
					@save="saveGitHubToken"
					@clear="clearGitHubToken"
				/>
			</template>
		</section>

		<DashboardFooter
			:checking-client="
				clientChecking || clientDownloadingAll || Boolean(clientDownloadingKey)
			"
			:checking-addons="false"
			:can-launch-game="Boolean(wowValidation?.valid)"
			:launching-game="gameLaunching"
			:status-text="footerStatusText"
			:status-tone="footerStatusTone"
			@check-client="checkClient"
			@check-addons="checkAddons"
			@launch-game="launchGame"
		/>

		<ClientPathModal
			v-if="shouldShowClientPathModal"
			v-model:wow-path="wowPath"
			:error="error"
			@select="selectWowPath"
			@save="saveWowPath"
		/>

		<GitHubTokenModal
			v-if="tokenModalOpen"
			v-model:token="githubToken"
			:error="tokenModalError"
			@save="saveGitHubToken"
			@clear="clearGitHubToken"
			@close="tokenModalOpen = false"
		/>
	</main>
</template>
