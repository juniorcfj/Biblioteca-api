import { Clock, IdGenerator } from '../src/application/ports';

export class FakeClock implements Clock {
  constructor(private current: Date = new Date('2026-01-01T10:00:00.000Z')) {}

  now(): Date {
    return new Date(this.current);
  }

  advanceDays(days: number): void {
    this.current = new Date(this.current.getTime() + days * 24 * 60 * 60 * 1000);
  }
}

export class SequentialIds implements IdGenerator {
  private n = 0;

  next(): string {
    this.n += 1;
    return `id-${this.n}`;
  }
}
