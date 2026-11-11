import { Book } from '../domain/book';
import { Loan } from '../domain/loan';

// Portas (interfaces) que o domínio/aplicação exige. A infraestrutura implementa.
export interface BookRepository {
  save(book: Book): Promise<void>;
  findById(id: string): Promise<Book | undefined>;
  list(): Promise<Book[]>;
}

export interface LoanRepository {
  save(loan: Loan): Promise<void>;
  findById(id: string): Promise<Loan | undefined>;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}
