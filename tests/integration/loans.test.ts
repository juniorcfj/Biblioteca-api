import { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';
import { FakeClock, SequentialIds } from '../helpers';

let app: Express;
let clock: FakeClock;

beforeEach(() => {
  clock = new FakeClock();
  ({ app } = buildApp({ clock, ids: new SequentialIds() }));
});

describe('fluxo principal: cadastrar -> emprestar -> devolver', () => {
  it('funciona de ponta a ponta via HTTP', async () => {
    const created = await request(app)
      .post('/books')
      .send({ title: 'Dom Casmurro', author: 'Machado de Assis', copies: 1 })
      .expect(201);
    const bookId = created.body.id as string;
    expect(created.body.copiesAvailable).toBe(1);

    const loan = await request(app).post('/loans').send({ bookId, borrower: 'Ana' }).expect(201);
    expect(loan.body.status).toBe('ACTIVE');

    const afterLoan = await request(app).get(`/books/${bookId}`).expect(200);
    expect(afterLoan.body.copiesAvailable).toBe(0);

    // sem exemplares -> 409
    const conflict = await request(app).post('/loans').send({ bookId, borrower: 'Bia' }).expect(409);
    expect(conflict.body.error.code).toBe('NO_COPIES_AVAILABLE');

    clock.advanceDays(20);
    const returned = await request(app).post(`/loans/${loan.body.id}/return`).expect(200);
    expect(returned.body.status).toBe('RETURNED');
    expect(returned.body.late).toBe(true);

    const afterReturn = await request(app).get(`/books/${bookId}`).expect(200);
    expect(afterReturn.body.copiesAvailable).toBe(1);

    // devolver de novo -> 409
    const again = await request(app).post(`/loans/${loan.body.id}/return`).expect(409);
    expect(again.body.error.code).toBe('LOAN_ALREADY_RETURNED');

    const fetched = await request(app).get(`/loans/${loan.body.id}`).expect(200);
    expect(fetched.body.status).toBe('RETURNED');
  });
});

describe('validação e erros', () => {
  it('400 com detalhes para payload inválido', async () => {
    const res = await request(app).post('/books').send({ title: '', copies: 0 }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('400 para JSON malformado', async () => {
    const res = await request(app)
      .post('/books')
      .set('Content-Type', 'application/json')
      .send('{ quebrado')
      .expect(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('404 para livro, empréstimo e rota inexistentes', async () => {
    await request(app).get('/books/nope').expect(404);
    await request(app).get('/loans/nope').expect(404);
    await request(app).post('/loans/nope/return').expect(404);
    await request(app).post('/loans').send({ bookId: 'nope', borrower: 'Ana' }).expect(404);
    const res = await request(app).get('/nada').expect(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('lista livros', async () => {
    await request(app).post('/books').send({ title: 'A', author: 'X', copies: 1 }).expect(201);
    const res = await request(app).get('/books').expect(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('operação', () => {
  it('/health responde ok e devolve x-request-id', async () => {
    const res = await request(app).get('/health').set('x-request-id', 'abc-123').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
    expect(res.headers['x-request-id']).toBe('abc-123');
  });

  it('/metrics expõe a métrica de latência e o contador de empréstimos', async () => {
    const book = await request(app)
      .post('/books')
      .send({ title: 'T', author: 'A', copies: 1 })
      .expect(201);
    await request(app).post('/loans').send({ bookId: book.body.id, borrower: 'Ana' }).expect(201);
    const res = await request(app).get('/metrics').expect(200);
    expect(res.text).toContain('http_request_duration_seconds_bucket');
    expect(res.text).toContain('library_loans_created_total 1');
  });

  it('/openapi.json serve o contrato', async () => {
    const res = await request(app).get('/openapi.json').expect(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.paths['/loans']).toBeDefined();
  });
});
