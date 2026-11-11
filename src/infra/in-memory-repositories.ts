import { randomUUID } from 'node:crypto';
import { BookRepository, Clock, IdGenerator, LoanRepository } from '../application/ports';
import { Book, BookProps } from '../domain/book';
import { Loan, LoanProps } from '../domain/loan';

// Guardam snapshots (cópias), nunca a instância: evita mutação por fora do repositório.
export class InMemoryBookRepository implements BookRepository {
  private readonly store = new Map<string, BookProps>();

  async save(book: Book): Promise<void> {
    this.store.set(book.id, book.snapshot());
  }

  async findById(id: string): Promise<Book | undefined> {
    const props = this.store.get(id);
    return props ? Book.restore(props) : undefined;
  }

  async list(): Promise<Book[]> {
    return [...this.store.values()].map((props) => Book.restore(props));
  }
}

export class InMemoryLoanRepository implements LoanRepository {
  private readonly store = new Map<string, LoanProps>();

  async save(loan: Loan): Promise<void> {
    this.store.set(loan.id, loan.snapshot());
  }

  async findById(id: string): Promise<Loan | undefined> {
    const props = this.store.get(id);
    return props ? Loan.restore(props) : undefined;
  }
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class UuidGenerator implements IdGenerator {
  next(): string {
    return randomUUID();
  }
}
