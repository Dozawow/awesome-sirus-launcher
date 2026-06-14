<script setup lang="ts">
import { computed } from 'vue'
import type {
	ClientCheckResult,
	ClientPatchCheckFile,
	ClientPatchFileInput,
	ClientPatchManifestResult
} from '@shared/contracts'
import BaseButton from '@renderer/components/BaseButton.vue'
import BasePanel from '@renderer/components/BasePanel.vue'
import StatusBadge from '@renderer/components/StatusBadge.vue'
import { useLocale } from '@renderer/composables/useLocale'

const props = defineProps<{
	manifest: ClientPatchManifestResult | null
	result: ClientCheckResult | null
	checking: boolean
	loadingManifest: boolean
	downloadingKey: string
	downloadingAll: boolean
}>()

defineEmits<{
	load: []
	check: []
	downloadFile: [input: ClientPatchFileInput]
	downloadMissing: []
}>()

const { t } = useLocale()

const checkedFilesByKey = computed(() => {
	const files = new Map<string, ClientPatchCheckFile>()
	for (const file of props.result?.files ?? []) files.set(createFileKey(file), file)

	return files
})

const tableFiles = computed(() => props.manifest?.files ?? props.result?.files ?? [])

const problemCount = computed(
	() => (props.result?.files ?? []).filter((file) => file.status !== 'ok').length
)

function statusLabelKey(status: ClientCheckResult['files'][number]['status']) {
	if (status === 'missing') return 'clientCheck.status.missing'
	if (status === 'outdated') return 'clientCheck.status.outdated'
	return 'clientCheck.status.ok'
}

function createFileKey(file: Pick<ClientPatchFileInput, 'fileName' | 'relativePath'>): string {
	return `${file.relativePath}\u0000${file.fileName}`
}

function fileStatus(file: Pick<ClientPatchFileInput, 'fileName' | 'relativePath'>) {
	return checkedFilesByKey.value.get(createFileKey(file))?.status ?? 'pending'
}

function fileStatusLabel(file: Pick<ClientPatchFileInput, 'fileName' | 'relativePath'>): string {
	const status = fileStatus(file)
	return status === 'pending' ? t('clientCheck.status.pending') : t(statusLabelKey(status))
}

function fileSize(size: number): string {
	return t('clientCheck.sizeKb', { size: Math.ceil(size / 1024) })
}
</script>

<template>
	<BasePanel>
		<div class="panel-heading">
			<div>
				<h3>{{ t('clientCheck.title') }}</h3>
				<p>{{ t('clientCheck.description') }}</p>
			</div>
			<div class="panel-heading__actions">
				<BaseButton variant="secondary" :disabled="loadingManifest" @click="$emit('load')">
					{{ loadingManifest ? t('clientCheck.loading') : t('clientCheck.load') }}
				</BaseButton>
				<BaseButton :disabled="checking || !manifest" @click="$emit('check')">
					{{ checking ? t('clientCheck.checking') : t('clientCheck.check') }}
				</BaseButton>
			</div>
		</div>

		<div v-if="manifest" class="result">
			<StatusBadge>
				{{ t('clientCheck.manifestLoaded', { total: manifest.total }) }}
			</StatusBadge>
			<p class="path-text">{{ manifest.sourceUrl }}</p>
		</div>

		<div v-if="result" class="result">
			<StatusBadge :tone="result.missing === 0 && result.outdated === 0 ? 'ok' : 'warning'">
				{{
					result.missing === 0 && result.outdated === 0
						? t('clientCheck.clean')
						: t('clientCheck.problem')
				}}
			</StatusBadge>
			<p>
				{{
					t('clientCheck.summary', {
						total: result.total,
						ok: result.ok,
						missing: result.missing,
						outdated: result.outdated
					})
				}}
			</p>
			<p class="path-text">{{ result.sourceUrl }}</p>
		</div>

		<div v-if="tableFiles.length > 0" class="client-files-table">
			<div class="client-files-table__head">
				<span>{{ t('clientCheck.table.file') }}</span>
				<span>{{ t('clientCheck.table.size') }}</span>
				<span>{{ t('clientCheck.table.status') }}</span>
				<span>{{ t('clientCheck.table.action') }}</span>
			</div>
			<div
				v-for="file in tableFiles"
				:key="createFileKey(file)"
				class="client-files-table__row"
			>
				<div class="path-text">
					<strong>{{ file.fileName }}</strong>
					<span>{{ file.relativePath }}</span>
				</div>
				<span>{{ fileSize(file.expectedSize) }}</span>
				<StatusBadge
					:tone="
						fileStatus(file) === 'ok'
							? 'ok'
							: fileStatus(file) === 'pending'
								? undefined
								: 'warning'
					"
				>
					{{ fileStatusLabel(file) }}
				</StatusBadge>
				<BaseButton
					variant="secondary"
					:disabled="downloadingKey === createFileKey(file) || downloadingAll"
					@click="
						$emit('downloadFile', {
							fileName: file.fileName,
							relativePath: file.relativePath
						})
					"
				>
					{{
						downloadingKey === createFileKey(file)
							? t('clientCheck.downloading')
							: t('clientCheck.downloadFile')
					}}
				</BaseButton>
			</div>
			<div class="client-files-table__footer">
				<span>{{ t('clientCheck.problemCount', { total: problemCount }) }}</span>
				<BaseButton
					:disabled="
						!result || problemCount === 0 || downloadingAll || Boolean(downloadingKey)
					"
					@click="$emit('downloadMissing')"
				>
					{{
						downloadingAll
							? t('clientCheck.downloadingAll')
							: t('clientCheck.downloadAll')
					}}
				</BaseButton>
			</div>
		</div>
	</BasePanel>
</template>
