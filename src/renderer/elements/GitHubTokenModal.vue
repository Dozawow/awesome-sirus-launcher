<script setup lang="ts">
import BaseButton from '@renderer/components/BaseButton.vue'
import TextField from '@renderer/components/TextField.vue'
import { useLocale } from '@renderer/composables/useLocale'

defineProps<{
	token: string
	error: string
}>()

defineEmits<{
	'update:token': [value: string]
	save: []
	clear: []
	close: []
}>()

const { t } = useLocale()
</script>

<template>
	<div class="modal-overlay">
		<div class="modal-shell token-modal">
			<div class="modal-heading">
				<div>
					<p class="eyebrow">{{ t('token.quickEyebrow') }}</p>
					<h3>{{ t('token.quickTitle') }}</h3>
					<p>{{ t('token.description') }}</p>
				</div>
				<button
					class="icon-button"
					type="button"
					:aria-label="t('token.close')"
					@click="$emit('close')"
				>
					×
				</button>
			</div>

			<TextField
				:model-value="token"
				type="password"
				:placeholder="t('token.placeholder')"
				@update:model-value="$emit('update:token', $event)"
			/>

			<p v-if="error" class="error">{{ error }}</p>

			<div class="modal-actions">
				<BaseButton @click="$emit('save')">{{ t('token.save') }}</BaseButton>
				<BaseButton variant="secondary" @click="$emit('clear')">{{
					t('token.clear')
				}}</BaseButton>
			</div>
		</div>
	</div>
</template>
