<script setup lang="ts">
import BaseButton from '@renderer/components/BaseButton.vue'
import TextField from '@renderer/components/TextField.vue'
import { useLocale } from '@renderer/composables/useLocale'

defineProps<{
	wowPath: string
	error: string
}>()

defineEmits<{
	'update:wowPath': [value: string]
	select: []
	save: []
}>()

const { t } = useLocale()
</script>

<template>
	<div class="modal-overlay">
		<section
			class="modal-shell"
			role="dialog"
			aria-modal="true"
			:aria-label="t('clientPathModal.title')"
		>
			<div>
				<p class="eyebrow">{{ t('clientPathModal.eyebrow') }}</p>
				<h3>{{ t('clientPathModal.title') }}</h3>
				<p>{{ t('clientPathModal.description') }}</p>
			</div>

			<div class="path-row modal-path-row">
				<TextField
					:model-value="wowPath"
					:placeholder="t('wow.placeholder')"
					@update:model-value="$emit('update:wowPath', $event)"
				/>
				<BaseButton variant="secondary" @click="$emit('select')">
					{{ t('wow.select') }}
				</BaseButton>
				<BaseButton @click="$emit('save')">{{ t('wow.save') }}</BaseButton>
			</div>

			<p v-if="error" class="error">{{ error }}</p>
		</section>
	</div>
</template>
