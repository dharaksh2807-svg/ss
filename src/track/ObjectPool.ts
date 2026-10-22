export class ObjectPool<T> {
  private available: T[] = [];
  private active: Set<T> = new Set();
  private factory: () => T;
  private resetFn?: (item: T) => void;

  constructor(factory: () => T, resetFn?: (item: T) => void, initialSize: number = 0) {
    this.factory = factory;
    this.resetFn = resetFn;

    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.factory());
    }
  }

  public acquire(): T {
    let item: T;
    if (this.available.length > 0) {
      item = this.available.pop()!;
    } else {
      item = this.factory();
    }

    this.active.add(item);
    if (this.resetFn) {
      this.resetFn(item);
    }
    return item;
  }

  public release(item: T): void {
    if (this.active.has(item)) {
      this.active.delete(item);
      this.available.push(item);
    }
  }

  public releaseAll(): void {
    for (const item of this.active) {
      this.available.push(item);
    }
    this.active.clear();
  }

  public getActiveCount(): number {
    return this.active.size;
  }
}
