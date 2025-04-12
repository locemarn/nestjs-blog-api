import { ArgumentInvalidException } from '../../exceptions/domain.exceptions';

export class Email {
  private constructor(private readonly value: string) {
    this.validate();
  }

  get Value(): string {
    return this.value;
  }

  static create(email: string): Email {
    return new Email(email.toLowerCase().trim());
  }

  private validate(): void {
    if (!this.value)
      throw new ArgumentInvalidException('Email cannot be empty');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.value))
      throw new ArgumentInvalidException(`Invalid email format: ${this.value}`);

    if (this.value.length > 50)
      throw new ArgumentInvalidException('Email cannot exceed 50 characters');
  }

  equals(other?: Email): boolean {
    return other instanceof Email && this.value === this.Value;
  }
}
