/**
 * A utility class inspired by discord.js's Collection, to help with maps.
 */
export class Collection<K, V> extends Map {
	public forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
		super.forEach(callbackfn, thisArg)
	}
	public get(key: K): V | undefined {
		return super.get(key)
	}
	public delete(key: K): boolean {
		return super.delete(key)
	}
	public entries(): IterableIterator<[K, V]> {
		return super.entries()
	}
	public values(): IterableIterator<V> {
		return super.values()
	}
	/**
	 * A port of Array.some to maps.
	 * @param filter A function returning true or false if the value matches the criteria.
	 */
	public some(filter: (value: V) => boolean) {
		let found = false
		for (const value of this.values()) {
			if (filter(value)) {
				found = true
			}
		}
		return found
	}
}