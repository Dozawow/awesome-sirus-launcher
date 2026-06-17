<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { AddonsListResult, AddonSummary } from '@shared/contracts'
import { launcherApi } from '@renderer/api/launcherApi'
import BaseButton from '@renderer/components/BaseButton.vue'
import BasePanel from '@renderer/components/BasePanel.vue'
import StatusBadge from '@renderer/components/StatusBadge.vue'
import TextField from '@renderer/components/TextField.vue'
import { useLocale } from '@renderer/composables/useLocale'

const props = defineProps<{
	addonResult?: AddonsListResult | null
	checkingExternal?: boolean
}>()
const emit = defineEmits<{
	checked: [result: AddonsListResult]
}>()

const { t } = useLocale()

const catalogAddons = ref<AddonSummary[]>([])
const checkedAddons = ref<AddonSummary[]>([])
const loading = ref(false)
const checking = ref(false)
const updatingAddonId = ref('')
const deletingAddonId = ref('')
const addonPendingDelete = ref<AddonSummary | null>(null)
const customName = ref('')
const customUrl = ref('')
const notice = ref('')
const error = ref('')

const addons = computed(() => mergeAddonLists(catalogAddons.value, checkedAddons.value))
const communityCount = computed(
	() => addons.value.filter((addon) => addon.source === 'community').length
)
const sirusCount = computed(() => addons.value.filter((addon) => addon.source === 'sirus').length)
const customCount = computed(() => addons.value.filter((addon) => addon.source === 'custom').length)
const problemCount = computed(
	() => addons.value.filter((addon) => addon.status === 'outdated').length
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
const isChecking = computed(() => checking.value || props.checkingExternal === true)

watch(
	() => props.addonResult,
	(result) => {
		if (!result) return
		mergeCheckedAddons(result.addons)
	},
	{ immediate: true }
)

onMounted(() => {
	void loadAddons()
})

async function loadAddons(): Promise<void> {
	await run(async () => {
		loading.value = true
		const result = await launcherApi.addons.list()
		catalogAddons.value = result.addons
		if (props.addonResult) mergeCheckedAddons(props.addonResult.addons)
		notice.value = t('addons.loaded')
	})
	loading.value = false
}

async function checkAddons(): Promise<void> {
	await run(async () => {
		checking.value = true
		await ensureCatalogLoaded()
		const result = await launcherApi.addons.check()
		replaceCheckedAddons(result.addons)
		emit('checked', result)
		notice.value = t('addons.checked')
	})
	checking.value = false
}

async function installAddon(addon: AddonSummary): Promise<void> {
	await run(async () => {
		updatingAddonId.value = addon.id
		const result = await launcherApi.addons.install({ addonId: addon.id })
		upsertCheckedAddon(result.addon)
		const checked = await launcherApi.addons.check()
		replaceCheckedAddons(checked.addons)
		emit('checked', checked)
		notice.value = t('addons.installed')
	})
	updatingAddonId.value = ''
}

function requestDeleteAddon(addon: AddonSummary): void {
	addonPendingDelete.value = addon
}

function cancelDeleteAddon(): void {
	addonPendingDelete.value = null
}

async function confirmDeleteAddon(): Promise<void> {
	const addon = addonPendingDelete.value
	if (!addon) return

	await run(async () => {
		deletingAddonId.value = addon.id
		const result = await launcherApi.addons.delete({ addonId: addon.id })
		const checked = await launcherApi.addons.check()
		replaceCheckedAddons([...checked.addons, result.addon])
		emit('checked', checked)
		notice.value = t('addons.deleted')
		addonPendingDelete.value = null
	})
	deletingAddonId.value = ''
}

async function updateAll(): Promise<void> {
	await run(async () => {
		checking.value = true
		await ensureCatalogLoaded()
		const result = await launcherApi.addons.updateAll()
		for (const installed of result.installed) {
			upsertCheckedAddon(installed.addon)
		}
		mergeCheckedAddons(result.skipped)
		const checked = await launcherApi.addons.check()
		replaceCheckedAddons(checked.addons)
		emit('checked', checked)
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
		catalogAddons.value = result.addons
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
		catalogAddons.value = listResult.addons
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
		deletingAddonId.value = ''
	}
}

function upsertCheckedAddon(addon: AddonSummary): void {
	const index = checkedAddons.value.findIndex((item) => item.id === addon.id)
	if (index >= 0) checkedAddons.value[index] = addon
	else checkedAddons.value.push(addon)
}

function mergeCheckedAddons(nextAddons: AddonSummary[]): void {
	for (const addon of nextAddons) {
		upsertCheckedAddon(addon)
	}
}

function replaceCheckedAddons(nextAddons: AddonSummary[]): void {
	checkedAddons.value = nextAddons
}

function mergeAddonLists(
	baseAddons: AddonSummary[],
	overrideAddons: AddonSummary[]
): AddonSummary[] {
	const merged = new Map(baseAddons.map((addon) => [addon.id, addon]))
	for (const addon of overrideAddons) {
		merged.set(addon.id, addon)
	}

	return [...merged.values()]
}

async function ensureCatalogLoaded(): Promise<void> {
	if (catalogAddons.value.length > 0) return

	const result = await launcherApi.addons.list()
	catalogAddons.value = result.addons
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

function canDeleteAddon(addon: AddonSummary): boolean {
	return (
		addon.status !== 'not-installed' &&
		addon.status !== 'manual-git' &&
		deletingAddonId.value !== addon.id
	)
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
				<BaseButton
					variant="secondary"
					:disabled="loading || isChecking"
					@click="loadAddons"
				>
					{{ loading ? t('addons.loading') : t('addons.load') }}
				</BaseButton>
				<BaseButton :disabled="loading || isChecking" @click="checkAddons">
					{{ isChecking ? t('addons.checking') : t('addons.check') }}
				</BaseButton>
				<BaseButton
					variant="secondary"
					:disabled="loading || isChecking"
					@click="updateAll"
				>
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
				<div
					v-for="addon in table.addons"
					:key="addon.id"
					class="addons-table__row"
					tabindex="0"
				>
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
					<div class="addon-actions">
						<BaseButton
							variant="secondary"
							:disabled="
								addon.status === 'manual-git' || updatingAddonId === addon.id
							"
							@click="installAddon(addon)"
						>
							{{
								updatingAddonId === addon.id
									? t('addons.installing')
									: t('addons.install')
							}}
						</BaseButton>
						<BaseButton
							variant="danger"
							:disabled="!canDeleteAddon(addon)"
							@click="requestDeleteAddon(addon)"
						>
							{{
								deletingAddonId === addon.id
									? t('addons.deleting')
									: t('addons.delete')
							}}
						</BaseButton>
					</div>
					<div class="addon-tooltip" role="tooltip">
						<strong>{{ addon.name }}</strong>
						<p v-if="addon.description">{{ addon.description }}</p>
					</div>
				</div>
			</div>
		</section>
	</BasePanel>

	<div v-if="addonPendingDelete" class="modal-overlay">
		<section class="modal-shell" role="dialog" aria-modal="true">
			<div class="modal-heading">
				<div>
					<p class="eyebrow">{{ t('addons.delete') }}</p>
					<h3>{{ t('addons.deleteTitle') }}</h3>
					<p>
						{{
							t('addons.deleteDescription', {
								name: addonPendingDelete.name
							})
						}}
					</p>
				</div>
			</div>
			<p v-if="error" class="error">{{ error }}</p>
			<div class="modal-actions">
				<BaseButton variant="secondary" @click="cancelDeleteAddon">
					{{ t('addons.deleteCancel') }}
				</BaseButton>
				<BaseButton
					variant="danger"
					:disabled="deletingAddonId === addonPendingDelete.id"
					@click="confirmDeleteAddon"
				>
					{{
						deletingAddonId === addonPendingDelete.id
							? t('addons.deleting')
							: t('addons.deleteConfirm')
					}}
				</BaseButton>
			</div>
		</section>
	</div>
</template>
