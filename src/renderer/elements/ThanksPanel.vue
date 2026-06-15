<script setup lang="ts">
import { CircleDollarSign, ExternalLink, HeartHandshake, SquareCode } from '@lucide/vue'
import BasePanel from '@renderer/components/BasePanel.vue'
import { useLocale } from '@renderer/composables/useLocale'

const { t } = useLocale()

const creators = [
	{
		name: 'fxpw',
		github: 'https://github.com/fxpw',
		boosty: 'https://boosty.to/fxpw',
		yoomoney: '4100118173430513'
	},
	{
		name: 'accidev',
		github: 'https://github.com/accidev',
		boosty: 'https://boosty.to/accidev',
		yoomoney: '41001465529206'
	}
] as const

function createYoomoneyUrl(wallet: string): string {
	return `https://yoomoney.ru/to/${wallet}`
}
</script>

<template>
	<BasePanel>
		<div class="panel-heading">
			<div>
				<h3>{{ t('thanks.title') }}</h3>
				<p>{{ t('thanks.description') }}</p>
			</div>
			<HeartHandshake :size="28" class="thanks-heading-icon" aria-hidden="true" />
		</div>

		<div class="thanks-grid">
			<article v-for="creator in creators" :key="creator.name" class="thanks-card">
				<div class="thanks-card__header">
					<strong>{{ creator.name }}</strong>
					<span>{{ t('thanks.creator') }}</span>
				</div>

				<div class="thanks-card__links">
					<a :href="creator.github" target="_blank" rel="noreferrer" class="thanks-link">
						<SquareCode :size="18" />
						<span>{{ t('thanks.github') }}</span>
						<ExternalLink :size="16" />
					</a>

					<a :href="creator.boosty" target="_blank" rel="noreferrer" class="thanks-link">
						<HeartHandshake :size="18" />
						<span>{{ t('thanks.boosty') }}</span>
						<ExternalLink :size="16" />
					</a>

					<a
						:href="createYoomoneyUrl(creator.yoomoney)"
						target="_blank"
						rel="noreferrer"
						class="thanks-link"
					>
						<CircleDollarSign :size="18" />
						<span>{{ t('thanks.yoomoney', { wallet: creator.yoomoney }) }}</span>
						<ExternalLink :size="16" />
					</a>
				</div>
			</article>
		</div>
	</BasePanel>
</template>
