import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createAccountService } from '../src/main/accounts/accountService'
import { createSecretStore } from '../src/main/secrets/memorySecretStore'

describe('account service', () => {
	it('stores account summaries without returning passwords', async () => {
		const root = await mkdtemp(join(tmpdir(), 'sirus-accounts-'))
		const service = createAccountService(() => root, createSecretStore())

		const result = await service.add({ login: 'fxpw', password: 'secret' })

		expect(result.accounts).toHaveLength(1)
		expect(result.accounts[0]).toMatchObject({ login: 'fxpw' })
		expect(JSON.stringify(result)).not.toContain('secret')
		expect(result.selectedAccountId).toBe(result.accounts[0].id)
	})

	it('writes selected account credentials to Config.wtf before launch', async () => {
		const root = await mkdtemp(join(tmpdir(), 'sirus-accounts-config-'))
		const wowPath = join(root, 'wow')
		await mkdir(join(wowPath, 'Data'), { recursive: true })
		await mkdir(join(wowPath, 'Interface'), { recursive: true })
		await mkdir(join(wowPath, 'WTF'), { recursive: true })
		await writeFile(join(wowPath, 'run.exe'), '')
		await writeFile(
			join(wowPath, 'WTF', 'Config.wtf'),
			['SET accountName "old"', 'SET readTerminationWithoutNotice "old"'].join('\n'),
			'utf8'
		)

		const service = createAccountService(() => root, createSecretStore())
		await service.add({ login: 'fxpw', password: 'password' })
		await service.applySelectedToWowConfig(wowPath)

		const configText = await readFile(join(wowPath, 'WTF', 'Config.wtf'), 'utf8')
		expect(configText).toContain('SET accountName "fxpw"')
		expect(configText).toContain('SET readTerminationWithoutNotice "password"')
	})
})
