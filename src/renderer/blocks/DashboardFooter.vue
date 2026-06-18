<script setup lang="ts">
import BaseButton from '@renderer/components/BaseButton.vue'
import { useLocale } from '@renderer/composables/useLocale'
import { Play, Puzzle, SearchCheck, X } from '@lucide/vue'

defineProps<{
	checkingClient: boolean
	checkingAddons: boolean
	addonUpdateCount: number
	canLaunchGame: boolean
	launchingGame: boolean
	statusText: string
	statusTone: 'neutral' | 'ok' | 'warning' | 'error'
}>()

defineEmits<{
	checkClient: []
	cancelClientCheck: []
	checkAddons: []
	launchGame: []
}>()

const { t } = useLocale()
</script>

<template>
	<footer class="footerbar">
		<div class="footerbar__actions">
			<BaseButton
				:variant="checkingClient ? 'danger' : 'primary'"
				@click="checkingClient ? $emit('cancelClientCheck') : $emit('checkClient')"
			>
				<X v-if="checkingClient" :size="16" />
				<SearchCheck v-else :size="16" />
				{{ checkingClient ? t('clientCheck.stop') : t('footer.checkClient') }}
			</BaseButton>
			<BaseButton
				variant="secondary"
				:disabled="checkingAddons"
				@click="$emit('checkAddons')"
			>
				<Puzzle :size="16" />
				{{
					checkingAddons
						? t('footer.checkingAddons')
						: addonUpdateCount > 0
							? t('footer.checkAddonsCount', { count: addonUpdateCount })
							: t('footer.checkAddons')
				}}
			</BaseButton>
		</div>
		<div class="footerbar__status" :class="`footerbar__status--${statusTone}`">
			{{ statusText }}
		</div>
		<BaseButton
			variant="icon"
			:disabled="!canLaunchGame || launchingGame"
			:aria-label="t('game.launch')"
			:title="t('game.launch')"
			@click="$emit('launchGame')"
		>
			<Play :size="20" />
		</BaseButton>
	</footer>
</template>
