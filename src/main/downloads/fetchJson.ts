export async function fetchJson(
	url: string,
	options: { signal?: AbortSignal } = {}
): Promise<unknown> {
	const response = await fetch(url, { signal: options.signal })
	if (!response.ok) {
		throw new Error(`Request failed ${response.status} ${response.statusText}`.trim())
	}

	return response.json()
}
