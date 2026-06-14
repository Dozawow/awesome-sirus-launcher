<script setup lang="ts">
import BasePanel from '@renderer/components/BasePanel.vue'
import StatusBadge from '@renderer/components/StatusBadge.vue'
import { useLocale } from '@renderer/composables/useLocale'

const { t } = useLocale()
</script>

<template>
	<BasePanel>
		<div class="panel-heading">
			<div>
				<h3>{{ t('addons.title') }}</h3>
				<p>{{ t('addons.description') }}</p>
			</div>
			<StatusBadge tone="neutral">{{ t('dashboard.soon') }}</StatusBadge>
		</div>

		<div class="result">
			<strong>{{ t('addons.emptyTitle') }}</strong>
			<p>{{ t('addons.emptyDescription') }}</p>
		</div>
	</BasePanel>
</template>
