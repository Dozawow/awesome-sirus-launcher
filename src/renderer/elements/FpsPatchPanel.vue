<script setup lang="ts">
import type { FpsPatchStatus } from '@shared/contracts'
import { Download, RefreshCw, Trash2 } from '@lucide/vue'
import BaseButton from '@renderer/components/BaseButton.vue'
import BasePanel from '@renderer/components/BasePanel.vue'
import StatusBadge from '@renderer/components/StatusBadge.vue'
import { useLocale } from '@renderer/composables/useLocale'

const props = defineProps<{
	status: FpsPatchStatus | null
	installing: boolean
}>()

defineEmits<{
	install: []
	delete: []
}>()

const { t } = useLocale()

function formatSize(size?: number): string {
	if (!size) return ''
	return t('fpsPatch.size', { size: Math.max(1, Math.round(size / 1024)) })
}
</script>

<template>
	<BasePanel>
		<div class="panel-heading">
			<div>
				<h3>{{ t('fpsPatch.title') }}</h3>
				<p>{{ t('fpsPatch.description') }}</p>
			</div>
			<div class="patch-actions">
				<BaseButton :disabled="installing" @click="$emit('install')">
					<RefreshCw v-if="props.status?.installed" :size="18" />
					<Download v-else :size="18" />
					{{
						installing
							? t('fpsPatch.installing')
							: props.status?.installed
								? t('fpsPatch.reinstall')
								: t('fpsPatch.install')
					}}
				</BaseButton>
				<StatusBadge :tone="status?.installed ? 'ok' : 'warning'">
					{{ status?.installed ? t('fpsPatch.installed') : t('fpsPatch.missing') }}
				</StatusBadge>
				<BaseButton
					v-if="status?.installed"
					variant="danger"
					:disabled="installing"
					@click="$emit('delete')"
				>
					<Trash2 :size="18" />
					{{ t('fpsPatch.delete') }}
				</BaseButton>
			</div>
		</div>

		<div class="result">
			<p v-if="status?.patchPath" class="path-text">{{ status.patchPath }}</p>
			<p v-if="status?.size">{{ formatSize(status.size) }}</p>
		</div>
	</BasePanel>
</template>
