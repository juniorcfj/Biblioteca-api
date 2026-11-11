import { describe, expect, it } from 'vitest';
import { Book } from '../../src/domain/book';
import { InvariantError, NoCopiesAvailableError, ValidationError } from '../../src/domain/errors';

const make = (copies = 2) => Book.create({ id: 'b1', title: ' Dom Casmurro ', author: 'Machado', copies });

describe('Book', () => {
  it('cria com todos os exemplares disponíveis e campos aparados', () => {
    const book = make(3);
    expect(book.snapshot()).toEqual({
      id: 'b1',
      title: 'Dom Casmurro',
      author: 'Machado',
      copiesTotal: 3,
      copiesAvailable: 3,
    });
  });

  it.each([
    ['título vazio', { title: ' ', author: 'A', copies: 1 }],
    ['autor vazio', { title: 'T', author: '', copies: 1 }],
    ['copies zero', { title: 'T', author: 'A', copies: 0 }],
    ['copies fracionário', { title: 'T', author: 'A', copies: 1.5 }],
  ])('rejeita %s', (_name, input) => {
    expect(() => Book.create({ id: 'x', ...input })).toThrow(ValidationError);
  });

  it('lend reduz exemplares disponíveis', () => {
    const book = make(2);
    book.lend();
    expect(book.copiesAvailable).toBe(1);
  });

  it('lend sem exemplares lança NoCopiesAvailableError', () => {
    const book = make(1);
    book.lend();
    expect(() => book.lend()).toThrow(NoCopiesAvailableError);
  });

  it('giveBack devolve o exemplar', () => {
    const book = make(1);
    book.lend();
    book.giveBack();
    expect(book.copiesAvailable).toBe(1);
  });

  it('giveBack acima do total viola invariante', () => {
    expect(() => make(1).giveBack()).toThrow(InvariantError);
  });

  it('snapshot/restore são cópias isoladas', () => {
    const book = make(2);
    const copy = Book.restore(book.snapshot());
    copy.lend();
    expect(book.copiesAvailable).toBe(2);
    expect(copy.copiesAvailable).toBe(1);
  });
});
