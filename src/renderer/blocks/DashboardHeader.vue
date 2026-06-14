<script setup lang="ts">
import type { GitHubTokenStatus } from '@shared/contracts'
import BaseButton from '@renderer/components/BaseButton.vue'
import { localeLabels, type Locale } from '@renderer/shared/i18n'
import { useLocale } from '@renderer/composables/useLocale'

defineProps<{
	githubTokenStatus: GitHubTokenStatus
	title: string
	eyebrow: string
}>()

defineEmits<{
	openToken: []
}>()

const { currentLocale, localeOptions, setLocale, t } = useLocale()
</script>

<template>
	<header class="topbar">
		<div>
			<p class="eyebrow">{{ eyebrow }}</p>
			<h2>{{ title }}</h2>
		</div>
		<div class="topbar__actions">
			<label class="locale-select">
				{{ t('locale.label') }}
				<select
					:value="currentLocale"
					@change="setLocale(($event.target as HTMLSelectElement).value as Locale)"
				>
					<option v-for="locale in localeOptions" :key="locale" :value="locale">
						{{ localeLabels[locale] }}
					</option>
				</select>
			</label>
			<button
				class="token-status-button"
				type="button"
				:class="{ 'token-status-button--ready': githubTokenStatus.configured }"
				@click="$emit('openToken')"
			>
				{{
					t('github.status', {
						status: githubTokenStatus.configured
							? t('github.configured')
							: t('github.missing')
					})
				}}
			</button>
		</div>
	</header>
</template>
