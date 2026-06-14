<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { AddonSummary } from '@shared/contracts'
import { launcherApi } from '@renderer/api/launcherApi'
import BaseButton from '@renderer/components/BaseButton.vue'
import BasePanel from '@renderer/components/BasePanel.vue'
import StatusBadge from '@renderer/components/StatusBadge.vue'
import TextField from '@renderer/components/TextField.vue'
import { useLocale } from '@renderer/composables/useLocale'

const { t } = useLocale()

const addons = ref<AddonSummary[]>([])
const loading = ref(false)
const checking = ref(false)
const updatingAddonId = ref('')
const customName = ref('')
const customUrl = ref('')
const notice = ref('')
const error = ref('')

const communityCount = computed(
	() => addons.value.filter((addon) => addon.source === 'community').length
)
const sirusCount = computed(() => addons.value.filter((addon) => addon.source === 'sirus').length)
const customCount = computed(() => addons.value.filter((addon) => addon.source === 'custom').length)
const problemCount = computed(
	() =>
		addons.value.filter(
			(addon) => addon.status === 'outdated' || addon.status === 'not-installed'
		).length
)
const addonTables = computed(() => [
	{
		key: 'sirus',
		title: t('addons.table.sirus'),
		total: sirusCount.value,
		addons: addons.value.filter((addon) => addon.source === 'sirus')
	},
	{
		key: 'community',
		title: t('addons.table.community'),
		total: communityCount.value,
		addons: addons.value.filter((addon) => addon.source === 'community')
	},
	{
		key: 'custom',
		title: t('addons.table.custom'),
		total: customCount.value,
		addons: addons.value.filter((addon) => addon.source === 'custom')
	}
])

onMounted(() => {
	void loadAddons()
})

async function loadAddons(): Promise<void> {
	await run(async () => {
		loading.value = true
		const result = await launcherApi.addons.list()
		addons.value = result.addons
		notice.value = t('addons.loaded')
	})
	loading.value = false
}

async function checkAddons(): Promise<void> {
	await run(async () => {
		checking.value = true
		await ensureCatalogLoaded()
		const result = await launcherApi.addons.check()
		mergeAddons(result.addons)
		notice.value = t('addons.checked')
	})
	checking.value = false
}

async function installAddon(addon: AddonSummary): Promise<void> {
	await run(async () => {
		updatingAddonId.value = addon.id
		const result = await launcherApi.addons.install({ addonId: addon.id })
		upsertAddon(result.addon)
		notice.value = t('addons.installed')
	})
	updatingAddonId.value = ''
}

async function updateAll(): Promise<void> {
	await run(async () => {
		checking.value = true
		await ensureCatalogLoaded()
		const result = await launcherApi.addons.updateAll()
		for (const installed of result.installed) {
			upsertAddon(installed.addon)
		}
		mergeAddons(result.skipped)
		notice.value = t('addons.updatedAll', { total: result.total })
	})
	checking.value = false
}

async function addCustomAddon(): Promise<void> {
	await run(async () => {
		const result = await launcherApi.addons.addCustom({
			name: customName.value,
			githubUrl: customUrl.value
		})
		addons.value = result.addons
		customName.value = ''
		customUrl.value = ''
		notice.value = t('addons.customAdded')
	})
}

async function exportCustomAddons(): Promise<void> {
	await run(async () => {
		const result = await launcherApi.addons.exportCustom()
		if (!result) return
		notice.value = t('addons.exported', { total: result.total })
	})
}

async function importCustomAddons(): Promise<void> {
	await run(async () => {
		const result = await launcherApi.addons.importCustom()
		if (!result) return
		const listResult = await launcherApi.addons.list()
		addons.value = listResult.addons
		notice.value = t('addons.imported', { total: result.total })
	})
}

async function run(action: () => Promise<void>): Promise<void> {
	error.value = ''
	notice.value = ''
	try {
		await action()
	} catch (err) {
		error.value = err instanceof Error ? err.message : t('addons.error')
	} finally {
		loading.value = false
		checking.value = false
		updatingAddonId.value = ''
	}
}

function upsertAddon(addon: AddonSummary): void {
	const index = addons.value.findIndex((item) => item.id === addon.id)
	if (index >= 0) addons.value[index] = addon
	else addons.value.push(addon)
}

function mergeAddons(nextAddons: AddonSummary[]): void {
	for (const addon of nextAddons) {
		upsertAddon(addon)
	}
}

async function ensureCatalogLoaded(): Promise<void> {
	if (addons.value.length > 0) return

	const result = await launcherApi.addons.list()
	addons.value = result.addons
}

function getStatusLabel(addon: AddonSummary): string {
	if (addon.status === 'installed') return t('addons.status.installed')
	if (addon.status === 'outdated') return t('addons.status.outdated')
	if (addon.status === 'not-installed') return t('addons.status.notInstalled')
	if (addon.status === 'manual-git') return t('addons.status.manualGit')
	return t('addons.status.unknown')
}

function getStatusReason(addon: AddonSummary): string {
	if (addon.error) return addon.error
	if (addon.status === 'manual-git') return t('addons.reason.manualGit')
	if (addon.status === 'not-installed') return t('addons.reason.notInstalled')
	if (addon.missingFolders.length > 0) {
		return t('addons.reason.missingFolders', { folders: addon.missingFolders.join(', ') })
	}
	if (addon.status === 'outdated' && addon.installedVersion && addon.remoteVersion) {
		return t('addons.reason.versionMismatch', {
			installed: addon.installedVersion,
			remote: addon.remoteVersion
		})
	}
	if (addon.status === 'installed') return t('addons.reason.installed')
	return t('addons.reason.unknown')
}

function getStatusTone(addon: AddonSummary): 'neutral' | 'ok' | 'warning' {
	if (addon.status === 'installed') return 'ok'
	if (addon.status === 'manual-git' || addon.status === 'outdated') return 'warning'
	return 'neutral'
}
</script>

<template>
	<BasePanel>
		<div class="panel-heading">
			<div>
				<h3>{{ t('addons.title') }}</h3>
				<p>{{ t('addons.description') }}</p>
			</div>
			<div class="panel-heading__actions">
				<BaseButton variant="secondary" :disabled="loading || checking" @click="loadAddons">
					{{ loading ? t('addons.loading') : t('addons.load') }}
				</BaseButton>
				<BaseButton :disabled="loading || checking" @click="checkAddons">
					{{ checking ? t('addons.checking') : t('addons.check') }}
				</BaseButton>
				<BaseButton variant="secondary" :disabled="loading || checking" @click="updateAll">
					{{ t('addons.updateAll') }}
				</BaseButton>
			</div>
		</div>

		<div class="addon-summary">
			<StatusBadge tone="neutral">{{
				t('addons.sourceCommunity', { total: communityCount })
			}}</StatusBadge>
			<StatusBadge tone="neutral">{{
				t('addons.sourceSirus', { total: sirusCount })
			}}</StatusBadge>
			<StatusBadge tone="neutral">{{
				t('addons.sourceCustom', { total: customCount })
			}}</StatusBadge>
			<StatusBadge :tone="problemCount > 0 ? 'warning' : 'ok'">
				{{ t('addons.problemCount', { total: problemCount }) }}
			</StatusBadge>
		</div>

		<div class="addon-custom-form">
			<TextField v-model="customName" :placeholder="t('addons.customName')" />
			<TextField v-model="customUrl" :placeholder="t('addons.customUrl')" />
			<BaseButton :disabled="!customName || !customUrl" @click="addCustomAddon">
				{{ t('addons.customAdd') }}
			</BaseButton>
			<BaseButton variant="secondary" @click="exportCustomAddons">
				{{ t('addons.customExport') }}
			</BaseButton>
			<BaseButton variant="secondary" @click="importCustomAddons">
				{{ t('addons.customImport') }}
			</BaseButton>
		</div>

		<p v-if="notice" class="notice">{{ notice }}</p>
		<p v-if="error" class="error">{{ error }}</p>

		<section v-for="table in addonTables" :key="table.key" class="addon-table-section">
			<div class="addon-table-section__heading">
				<h4>{{ table.title }}</h4>
				<StatusBadge tone="neutral">{{ table.total }}</StatusBadge>
			</div>
			<div class="addons-table">
				<div class="addons-table__head">
					<span>{{ t('addons.table.name') }}</span>
					<span>{{ t('addons.table.version') }}</span>
					<span>{{ t('addons.table.status') }}</span>
					<span>{{ t('addons.table.action') }}</span>
				</div>
				<div v-if="table.addons.length === 0" class="addons-table__empty">
					{{ t('addons.table.empty') }}
				</div>
				<div v-for="addon in table.addons" :key="addon.id" class="addons-table__row">
					<div class="path-text">
						<strong>{{ addon.name }}</strong>
						<span>{{ addon.category || addon.author || addon.description }}</span>
					</div>
					<span
						>{{ addon.installedVersion || '-' }} /
						{{ addon.remoteVersion || '-' }}</span
					>
					<StatusBadge :tone="getStatusTone(addon)" :title="getStatusReason(addon)">
						{{ getStatusLabel(addon) }}
					</StatusBadge>
					<BaseButton
						variant="secondary"
						:disabled="addon.status === 'manual-git' || updatingAddonId === addon.id"
						@click="installAddon(addon)"
					>
						{{
							updatingAddonId === addon.id
								? t('addons.installing')
								: t('addons.install')
						}}
					</BaseButton>
				</div>
			</div>
		</section>
	</BasePanel>
</template>
