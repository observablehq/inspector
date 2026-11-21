/**
 * Peeks at the first n elements of an iterator, returning both the peeked elements and a new
 * iterator that will yield all elements (including the peeked ones).
 */
export function peek<T>(iterator: Iterator<T>, n: number): [T[], Iterator<T> & Iterable<T>] {
  const peeked: T[] = [];
  for (let i = 0; i < n; ++i) {
    const result = iterator.next();
    if (result.done) break;
    peeked.push(result.value);
  }
  return [peeked, new PrefixIterator(peeked, iterator)];
}

class PrefixIterator<T> implements Iterator<T> {
  private index = 0;
  constructor(
    private readonly head: T[],
    private readonly rest: Iterator<T>
  ) {
    this.head = head;
    this.rest = rest;
  }
  next(): IteratorResult<T> {
    return this.index < this.head.length
      ? {value: this.head[this.index++], done: false}
      : this.rest.next();
  }
  [Symbol.iterator]() {
    return this;
  }
}
