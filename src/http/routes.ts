import { Request, RequestHandler, Response, Router } from 'express';
import { LibraryService } from '../application/library-service';
import { Metrics } from '../metrics';
import { createBookSchema, createLoanSchema } from './schemas';

// Express 4 não captura rejeições de handlers async; repassamos ao error handler.
const wrap =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };

export function createRoutes(service: LibraryService, metrics: Metrics): Router {
  const router = Router();

  router.post(
    '/books',
    wrap(async (req, res) => {
      const input = createBookSchema.parse(req.body);
      const book = await service.addBook(input);
      res.status(201).json(book.snapshot());
    }),
  );

  router.get(
    '/books',
    wrap(async (_req, res) => {
      const books = await service.listBooks();
      res.json(books.map((b) => b.snapshot()));
    }),
  );

  router.get(
    '/books/:id',
    wrap(async (req, res) => {
      const book = await service.getBook(req.params.id);
      res.json(book.snapshot());
    }),
  );

  // Fluxo principal: emprestar -> devolver
  router.post(
    '/loans',
    wrap(async (req, res) => {
      const input = createLoanSchema.parse(req.body);
      const loan = await service.lendBook(input);
      metrics.loansCreated.inc();
      res.status(201).json(loan.toJSON());
    }),
  );

  router.get(
    '/loans/:id',
    wrap(async (req, res) => {
      const loan = await service.getLoan(req.params.id);
      res.json(loan.toJSON());
    }),
  );

  router.post(
    '/loans/:id/return',
    wrap(async (req, res) => {
      const loan = await service.returnLoan(req.params.id);
      res.json(loan.toJSON());
    }),
  );

  return router;
}
