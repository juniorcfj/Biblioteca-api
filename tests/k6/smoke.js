import http from 'k6/http';
import { check, sleep } from 'k6';

// Smoke: fluxo principal (cadastrar -> emprestar -> devolver) com carga leve.
// Threshold de p95 alinhado ao SLO (docs/desempenho.md).
export const options = {
  vus: 5,
  duration: '20s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
const params = { headers: { 'Content-Type': 'application/json' } };

export default function () {
  const book = http.post(
    `${BASE}/books`,
    JSON.stringify({ title: `Livro ${__VU}-${__ITER}`, author: 'Autor', copies: 1 }),
    params,
  );
  check(book, { 'cadastro de livro: 201': (r) => r.status === 201 });

  const loan = http.post(
    `${BASE}/loans`,
    JSON.stringify({ bookId: book.json('id'), borrower: 'Ana' }),
    params,
  );
  check(loan, { 'empréstimo: 201': (r) => r.status === 201 });

  const ret = http.post(`${BASE}/loans/${loan.json('id')}/return`, null, params);
  check(ret, { 'devolução: 200': (r) => r.status === 200 });

  sleep(0.1);
}
