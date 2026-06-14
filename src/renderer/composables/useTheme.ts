import { watchEffect } from 'vue'

export type ThemeMode = 'dark'

export function useTheme() {
	watchEffect(() => {
		document.documentElement.dataset.theme = 'dark'
	})

	return {
		currentTheme: 'dark' as ThemeMode
	}
}
