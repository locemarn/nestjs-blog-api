export class Identifier {
  private constructor(private readonly value: number | string) {}

  get Value(): number | string {
    return this.value;
  }

  equals(other?: Identifier): boolean {
    if (!other) return false;
    return this.value === other.Value;
  }

  static create(value: number | string): Identifier {
    if (value === null || value === undefined)
      throw new Error('Identifier cannot be null or undefined');
    return new Identifier(value);
  }
}
