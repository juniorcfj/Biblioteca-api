import { LoanAlreadyReturnedError, ValidationError } from './errors';

export const LOAN_PERIOD_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface LoanProps {
  id: string;
  bookId: string;
  borrower: string;
  loanedAt: Date;
  dueAt: Date;
  returnedAt: Date | null;
  late: boolean;
}

export class Loan {
  private constructor(private readonly props: LoanProps) {}

  static open(input: { id: string; bookId: string; borrower: string; now: Date }): Loan {
    const borrower = input.borrower.trim();
    if (!borrower) throw new ValidationError('borrower é obrigatório');
    return new Loan({
      id: input.id,
      bookId: input.bookId,
      borrower,
      loanedAt: new Date(input.now),
      dueAt: new Date(input.now.getTime() + LOAN_PERIOD_DAYS * DAY_MS),
      returnedAt: null,
      late: false,
    });
  }

  static restore(props: LoanProps): Loan {
    return new Loan({
      ...props,
      loanedAt: new Date(props.loanedAt),
      dueAt: new Date(props.dueAt),
      returnedAt: props.returnedAt ? new Date(props.returnedAt) : null,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get bookId(): string {
    return this.props.bookId;
  }

  get isReturned(): boolean {
    return this.props.returnedAt !== null;
  }

  markReturned(now: Date): void {
    if (this.isReturned) throw new LoanAlreadyReturnedError(this.props.id);
    this.props.returnedAt = new Date(now);
    this.props.late = now.getTime() > this.props.dueAt.getTime();
  }

  snapshot(): LoanProps {
    return Loan.restore(this.props).props;
  }

  toJSON() {
    return {
      id: this.props.id,
      bookId: this.props.bookId,
      borrower: this.props.borrower,
      loanedAt: this.props.loanedAt.toISOString(),
      dueAt: this.props.dueAt.toISOString(),
      returnedAt: this.props.returnedAt ? this.props.returnedAt.toISOString() : null,
      status: this.isReturned ? 'RETURNED' : 'ACTIVE',
      late: this.props.late,
    };
  }
}
