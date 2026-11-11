import { InvariantError, NoCopiesAvailableError, ValidationError } from './errors';

export interface BookProps {
  id: string;
  title: string;
  author: string;
  copiesTotal: number;
  copiesAvailable: number;
}

export class Book {
  private constructor(private readonly props: BookProps) {}

  static create(input: { id: string; title: string; author: string; copies: number }): Book {
    const title = input.title.trim();
    const author = input.author.trim();
    if (!title) throw new ValidationError('título é obrigatório');
    if (!author) throw new ValidationError('autor é obrigatório');
    if (!Number.isInteger(input.copies) || input.copies < 1) {
      throw new ValidationError('copies deve ser um inteiro >= 1');
    }
    return new Book({
      id: input.id,
      title,
      author,
      copiesTotal: input.copies,
      copiesAvailable: input.copies,
    });
  }

  static restore(props: BookProps): Book {
    return new Book({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get copiesAvailable(): number {
    return this.props.copiesAvailable;
  }

  lend(): void {
    if (this.props.copiesAvailable <= 0) throw new NoCopiesAvailableError(this.props.id);
    this.props.copiesAvailable -= 1;
  }

  giveBack(): void {
    if (this.props.copiesAvailable >= this.props.copiesTotal) {
      throw new InvariantError(`Livro '${this.props.id}' já tem todos os exemplares na estante`);
    }
    this.props.copiesAvailable += 1;
  }

  snapshot(): BookProps {
    return { ...this.props };
  }
}
