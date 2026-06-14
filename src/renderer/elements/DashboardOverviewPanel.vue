<script setup lang="ts">
import type {
	ClientCheckResult,
	FpsPatchStatus,
	WowPathValidation,
	WtfBackupSummary
} from '@shared/contracts'
import BasePanel from '@renderer/components/BasePanel.vue'
import StatusBadge from '@renderer/components/StatusBadge.vue'
import { useLocale } from '@renderer/composables/useLocale'

const props = defineProps<{
	wowValidation: WowPathValidation | null
	fpsPatchStatus: FpsPatchStatus | null
	clientCheckResult: ClientCheckResult | null
	latestBackup: WtfBackupSummary | null
	addonsUpdated: boolean | null
}>()

const { t } = useLocale()

function clientTone(): 'neutral' | 'ok' | 'warning' {
	if (!props.clientCheckResult) return 'neutral'
	return props.clientCheckResult.missing === 0 && props.clientCheckResult.outdated === 0
		? 'ok'
		: 'warning'
}

function clientLabel(): string {
	if (!props.clientCheckResult) return t('dashboard.client.waiting')
	if (props.clientCheckResult.missing === 0 && props.clientCheckResult.outdated === 0) {
		return t('dashboard.client.ok')
	}

	return t('dashboard.client.problem', {
		missing: props.clientCheckResult.missing,
		outdated: props.clientCheckResult.outdated
	})
}

function formatBackupDate(backup: WtfBackupSummary | null): string {
	if (!backup) return t('dashboard.backup.none')

	return new Intl.DateTimeFormat(undefined, {
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(backup.createdAt))
}
</script>

<template>
	<BasePanel class="overview-panel">
		<div class="panel-heading">
			<div>
				<h3>{{ t('dashboard.title') }}</h3>
				<p>{{ t('dashboard.description') }}</p>
			</div>
		</div>

		<div class="tile-grid">
			<div class="info-tile">
				<span class="tile-label">{{ t('dashboard.tile.clientPath') }}</span>
				<strong>{{ wowValidation?.valid ? t('wow.valid') : t('wow.invalid') }}</strong>
				<StatusBadge :tone="wowValidation?.valid ? 'ok' : 'warning'">
					{{
						wowValidation?.valid ? t('dashboard.ready') : t('dashboard.actionRequired')
					}}
				</StatusBadge>
			</div>

			<div class="info-tile">
				<span class="tile-label">{{ t('dashboard.tile.fpsPatch') }}</span>
				<strong>
					{{
						fpsPatchStatus?.installed ? t('fpsPatch.installed') : t('fpsPatch.missing')
					}}
				</strong>
				<StatusBadge :tone="fpsPatchStatus?.installed ? 'ok' : 'warning'">
					{{
						fpsPatchStatus?.installed
							? t('dashboard.ready')
							: t('dashboard.actionRequired')
					}}
				</StatusBadge>
			</div>

			<div class="info-tile">
				<span class="tile-label">{{ t('dashboard.tile.addons') }}</span>
				<strong>
					{{
						addonsUpdated === true
							? t('dashboard.addons.ok')
							: t('dashboard.addons.unknown')
					}}
				</strong>
				<StatusBadge :tone="addonsUpdated === true ? 'ok' : 'neutral'">
					{{ t('dashboard.soon') }}
				</StatusBadge>
			</div>

			<div class="info-tile">
				<span class="tile-label">{{ t('dashboard.tile.clientCheck') }}</span>
				<strong>{{ clientLabel() }}</strong>
				<StatusBadge :tone="clientTone()">
					{{ clientCheckResult ? t('dashboard.checked') : t('dashboard.notChecked') }}
				</StatusBadge>
			</div>

			<div class="info-tile">
				<span class="tile-label">{{ t('dashboard.tile.wtfBackup') }}</span>
				<strong>{{ formatBackupDate(latestBackup) }}</strong>
				<StatusBadge :tone="latestBackup ? 'ok' : 'warning'">
					{{ latestBackup ? t('dashboard.ready') : t('dashboard.actionRequired') }}
				</StatusBadge>
			</div>
		</div>
	</BasePanel>
</template>
