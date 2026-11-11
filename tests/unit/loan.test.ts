import { describe, expect, it } from 'vitest';
import { LoanAlreadyReturnedError, ValidationError } from '../../src/domain/errors';
import { LOAN_PERIOD_DAYS, Loan } from '../../src/domain/loan';

const DAY = 24 * 60 * 60 * 1000;
const start = new Date('2026-01-01T10:00:00.000Z');
const open = () => Loan.open({ id: 'l1', bookId: 'b1', borrower: ' Ana ', now: start });

describe('Loan', () => {
  it('abre com prazo de 14 dias e status ACTIVE', () => {
    const json = open().toJSON();
    expect(json.borrower).toBe('Ana');
    expect(json.status).toBe('ACTIVE');
    expect(json.returnedAt).toBeNull();
    expect(new Date(json.dueAt).getTime()).toBe(start.getTime() + LOAN_PERIOD_DAYS * DAY);
  });

  it('rejeita borrower vazio', () => {
    expect(() => Loan.open({ id: 'l', bookId: 'b', borrower: '  ', now: start })).toThrow(
      ValidationError,
    );
  });

  it('devolução no prazo não é atrasada', () => {
    const loan = open();
    loan.markReturned(new Date(start.getTime() + 5 * DAY));
    expect(loan.isReturned).toBe(true);
    expect(loan.toJSON().status).toBe('RETURNED');
    expect(loan.toJSON().late).toBe(false);
  });

  it('devolução após o prazo marca late', () => {
    const loan = open();
    loan.markReturned(new Date(start.getTime() + 20 * DAY));
    expect(loan.toJSON().late).toBe(true);
  });

  it('não permite devolver duas vezes', () => {
    const loan = open();
    loan.markReturned(start);
    expect(() => loan.markReturned(start)).toThrow(LoanAlreadyReturnedError);
  });

  it('restore reconstrói a partir do snapshot', () => {
    const loan = open();
    loan.markReturned(start);
    const restored = Loan.restore(loan.snapshot());
    expect(restored.isReturned).toBe(true);
    expect(restored.id).toBe('l1');
  });
});
