export class Collection<K, V> extends Map {
    public forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
        super.forEach(callbackfn, thisArg)
    }
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