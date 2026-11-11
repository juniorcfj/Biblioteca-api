import { Book } from '../domain/book';
import { NotFoundError } from '../domain/errors';
import { Loan } from '../domain/loan';
import { BookRepository, Clock, IdGenerator, LoanRepository } from './ports';

export class LibraryService {
  constructor(
    private readonly books: BookRepository,
    private readonly loans: LoanRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async addBook(input: { title: string; author: string; copies: number }): Promise<Book> {
    const book = Book.create({ id: this.ids.next(), ...input });
    await this.books.save(book);
    return book;
  }

  listBooks(): Promise<Book[]> {
    return this.books.list();
  }

  async getBook(id: string): Promise<Book> {
    const book = await this.books.findById(id);
    if (!book) throw new NotFoundError('Livro', id);
    return book;
  }

  async lendBook(input: { bookId: string; borrower: string }): Promise<Loan> {
    const book = await this.getBook(input.bookId);
    const loan = Loan.open({
      id: this.ids.next(),
      bookId: input.bookId,
      borrower: input.borrower,
      now: this.clock.now(),
    });
    book.lend(); // regra de negócio: lança se não há exemplares
    await this.books.save(book);
    await this.loans.save(loan);
    return loan;
  }

  async returnLoan(loanId: string): Promise<Loan> {
    const loan = await this.getLoan(loanId);
    const book = await this.getBook(loan.bookId);
    loan.markReturned(this.clock.now()); // lança se já devolvido
    book.giveBack();
    await this.books.save(book);
    await this.loans.save(loan);
    return loan;
  }

  async getLoan(id: string): Promise<Loan> {
    const loan = await this.loans.findById(id);
    if (!loan) throw new NotFoundError('Empréstimo', id);
    return loan;
  }
}
