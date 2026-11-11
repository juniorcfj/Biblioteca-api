export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message);
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super('NOT_FOUND', `${entity} '${id}' não encontrado`);
  }
}

export class NoCopiesAvailableError extends DomainError {
  constructor(bookId: string) {
    super('NO_COPIES_AVAILABLE', `Livro '${bookId}' não tem exemplares disponíveis`);
  }
}

export class LoanAlreadyReturnedError extends DomainError {
  constructor(loanId: string) {
    super('LOAN_ALREADY_RETURNED', `Empréstimo '${loanId}' já foi devolvido`);
  }
}

export class InvariantError extends DomainError {
  constructor(message: string) {
    super('INVARIANT_VIOLATION', message);
  }
}
