export interface SecretStore {
	has(key: string): Promise<boolean>
	get(key: string): Promise<string | undefined>
	set(key: string, value: string): Promise<void>
	delete(key: string): Promise<void>
}

export function createSecretStore(): SecretStore {
	const secrets = new Map<string, string>()

	return {
		async has(key) {
			return secrets.has(key)
		},
		async get(key) {
			return secrets.get(key)
		},
		async set(key, value) {
			secrets.set(key, value)
		},
		async delete(key) {
			secrets.delete(key)
		}
	}
}
