import { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { DomainError, InvariantError, NotFoundError } from '../../src/domain/errors';
import { createErrorHandler } from '../../src/http/error-handler';
import { Logger } from '../../src/logger';

function run(err: unknown) {
  const logger = { error: vi.fn() };
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const res = { status } as unknown as Response;

  createErrorHandler(logger as unknown as Logger)(err, {} as Request, res, vi.fn());

  return { logger, status, json };
}

describe('createErrorHandler', () => {
  it('ZodError vira 400 com detalhes', () => {
    const err = new ZodError([{ code: 'custom', path: ['title'], message: 'inválido' }]);
    const { status, json } = run(err);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: [{ path: 'title', message: 'inválido' }],
      },
    });
  });

  it('erro de domínio mapeado usa o status da tabela (404) e não loga como erro', () => {
    const { status, json, logger } = run(new NotFoundError('Livro', 'x'));
    expect(status).toHaveBeenCalledWith(404);
    expect(json.mock.calls[0][0].error.code).toBe('NOT_FOUND');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('violação de invariante vira 500 e é logada', () => {
    const { status, logger } = run(new InvariantError('estado inválido'));
    expect(status).toHaveBeenCalledWith(500);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('erro de domínio com código desconhecido cai no 500 padrão', () => {
    const { status, logger } = run(new DomainError('CODIGO_NOVO', 'sem mapeamento'));
    expect(status).toHaveBeenCalledWith(500);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('SyntaxError com body (JSON malformado) vira 400 INVALID_JSON', () => {
    const err = Object.assign(new SyntaxError('Unexpected token'), { body: '{ quebrado' });
    const { status, json } = run(err);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: { code: 'INVALID_JSON', message: 'JSON malformado' },
    });
  });

  it('SyntaxError sem body é tratado como erro interno', () => {
    const { status, json } = run(new SyntaxError('bug no código'));
    expect(status).toHaveBeenCalledWith(500);
    expect(json.mock.calls[0][0].error.code).toBe('INTERNAL_ERROR');
  });

  it('erro desconhecido vira 500 genérico, sem vazar detalhes, e é logado', () => {
    const { status, json, logger } = run(new Error('segredo interno'));
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno' },
    });
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('valor lançado que não é Error também vira 500', () => {
    const { status } = run('texto solto');
    expect(status).toHaveBeenCalledWith(500);
  });
});