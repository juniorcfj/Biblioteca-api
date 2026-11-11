import { beforeEach, describe, expect, it } from 'vitest';
import { LibraryService } from '../../src/application/library-service';
import {
  LoanAlreadyReturnedError,
  NoCopiesAvailableError,
  NotFoundError,
} from '../../src/domain/errors';
import {
  InMemoryBookRepository,
  InMemoryLoanRepository,
  SystemClock,
  UuidGenerator,
} from '../../src/infra/in-memory-repositories';
import { FakeClock, SequentialIds } from '../helpers';

let clock: FakeClock;
let service: LibraryService;

beforeEach(() => {
  clock = new FakeClock();
  service = new LibraryService(
    new InMemoryBookRepository(),
    new InMemoryLoanRepository(),
    clock,
    new SequentialIds(),
  );
});

describe('LibraryService', () => {
  it('fluxo completo: cadastrar, emprestar, devolver', async () => {
    const book = await service.addBook({ title: 'Dom Casmurro', author: 'Machado', copies: 1 });
    const loan = await service.lendBook({ bookId: book.id, borrower: 'Ana' });
    expect((await service.getBook(book.id)).copiesAvailable).toBe(0);

    clock.advanceDays(3);
    const returned = await service.returnLoan(loan.id);
    expect(returned.toJSON().status).toBe('RETURNED');
    expect((await service.getBook(book.id)).copiesAvailable).toBe(1);
  });

  it('não empresta quando não há exemplares', async () => {
    const book = await service.addBook({ title: 'T', author: 'A', copies: 1 });
    await service.lendBook({ bookId: book.id, borrower: 'Ana' });
    await expect(service.lendBook({ bookId: book.id, borrower: 'Bia' })).rejects.toBeInstanceOf(
      NoCopiesAvailableError,
    );
  });

  it('não devolve duas vezes e não corrompe o estoque', async () => {
    const book = await service.addBook({ title: 'T', author: 'A', copies: 2 });
    const loan = await service.lendBook({ bookId: book.id, borrower: 'Ana' });
    await service.returnLoan(loan.id);
    await expect(service.returnLoan(loan.id)).rejects.toBeInstanceOf(LoanAlreadyReturnedError);
    expect((await service.getBook(book.id)).copiesAvailable).toBe(2);
  });

  it('empréstimo inválido não consome exemplar', async () => {
    const book = await service.addBook({ title: 'T', author: 'A', copies: 1 });
    await expect(service.lendBook({ bookId: book.id, borrower: ' ' })).rejects.toThrow();
    expect((await service.getBook(book.id)).copiesAvailable).toBe(1);
  });

  it('lança NotFoundError para ids inexistentes', async () => {
    await expect(service.getBook('nope')).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.getLoan('nope')).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.lendBook({ bookId: 'nope', borrower: 'Ana' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(service.returnLoan('nope')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lista os livros cadastrados', async () => {
    await service.addBook({ title: 'A', author: 'X', copies: 1 });
    await service.addBook({ title: 'B', author: 'Y', copies: 1 });
    expect(await service.listBooks()).toHaveLength(2);
  });
});

describe('adaptadores de infraestrutura', () => {
  it('SystemClock devolve a data atual e UuidGenerator ids únicos', () => {
    expect(Math.abs(new SystemClock().now().getTime() - Date.now())).toBeLessThan(1000);
    const gen = new UuidGenerator();
    expect(gen.next()).not.toEqual(gen.next());
  });
});
