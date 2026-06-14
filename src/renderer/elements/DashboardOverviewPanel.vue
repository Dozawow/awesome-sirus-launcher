<script setup lang="ts">
import type {
	ClientCheckResult,
	FpsPatchStatus,
	WowPathValidation,
	WtfBackupSummary
} from '@shared/contracts'
import BaseButton from '@renderer/components/BaseButton.vue'
import BasePanel from '@renderer/components/BasePanel.vue'
import StatusBadge from '@renderer/components/StatusBadge.vue'
import { useLocale } from '@renderer/composables/useLocale'
import { Archive, Download, FolderOpen, Play, Puzzle, SearchCheck, Trash2 } from '@lucide/vue'

const props = defineProps<{
	wowValidation: WowPathValidation | null
	fpsPatchStatus: FpsPatchStatus | null
	clientCheckResult: ClientCheckResult | null
	latestBackup: WtfBackupSummary | null
	addonsUpdated: boolean | null
	checkingClient: boolean
	installingFpsPatch: boolean
	creatingBackup: boolean
	launchingGame: boolean
}>()

defineEmits<{
	selectWowPath: []
	launchGame: []
	installFpsPatch: []
	deleteFpsPatch: []
	openAddons: []
	checkClient: []
	createBackup: []
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
						wowValidation?.valid
							? t('dashboard.status.ready')
							: t('dashboard.status.chooseFolder')
					}}
				</StatusBadge>
				<div class="tile-actions">
					<BaseButton variant="secondary" @click="$emit('selectWowPath')">
						<FolderOpen :size="16" />
						{{ t('wow.select') }}
					</BaseButton>
					<BaseButton
						:disabled="!wowValidation?.valid || launchingGame"
						@click="$emit('launchGame')"
					>
						<Play :size="16" />
						{{ launchingGame ? t('game.launching') : t('game.launch') }}
					</BaseButton>
				</div>
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
							? t('dashboard.status.installed')
							: t('dashboard.status.canInstall')
					}}
				</StatusBadge>
				<div class="tile-actions">
					<BaseButton
						v-if="!fpsPatchStatus?.installed"
						:disabled="installingFpsPatch"
						@click="$emit('installFpsPatch')"
					>
						<Download :size="16" />
						{{ installingFpsPatch ? t('fpsPatch.installing') : t('fpsPatch.install') }}
					</BaseButton>
					<BaseButton
						v-else
						variant="danger"
						:disabled="installingFpsPatch"
						@click="$emit('deleteFpsPatch')"
					>
						<Trash2 :size="16" />
						{{ t('fpsPatch.delete') }}
					</BaseButton>
				</div>
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
					{{ t('dashboard.status.inProgress') }}
				</StatusBadge>
				<div class="tile-actions">
					<BaseButton variant="secondary" @click="$emit('openAddons')">
						<Puzzle :size="16" />
						{{ t('footer.checkAddons') }}
					</BaseButton>
				</div>
			</div>

			<div class="info-tile">
				<span class="tile-label">{{ t('dashboard.tile.clientCheck') }}</span>
				<strong>{{ clientLabel() }}</strong>
				<StatusBadge :tone="clientTone()">
					{{
						clientCheckResult
							? t('dashboard.status.checked')
							: t('dashboard.status.notChecked')
					}}
				</StatusBadge>
				<div class="tile-actions">
					<BaseButton :disabled="checkingClient" @click="$emit('checkClient')">
						<SearchCheck :size="16" />
						{{ checkingClient ? t('clientCheck.checking') : t('clientCheck.check') }}
					</BaseButton>
				</div>
			</div>

			<div class="info-tile">
				<span class="tile-label">{{ t('dashboard.tile.wtfBackup') }}</span>
				<strong>{{ formatBackupDate(latestBackup) }}</strong>
				<StatusBadge :tone="latestBackup ? 'ok' : 'warning'">
					{{
						latestBackup
							? t('dashboard.status.backedUp')
							: t('dashboard.status.makeBackup')
					}}
				</StatusBadge>
				<div class="tile-actions">
					<BaseButton :disabled="creatingBackup" @click="$emit('createBackup')">
						<Archive :size="16" />
						{{ creatingBackup ? t('backup.creating') : t('backup.create') }}
					</BaseButton>
				</div>
			</div>
		</div>
	</BasePanel>
</template>
