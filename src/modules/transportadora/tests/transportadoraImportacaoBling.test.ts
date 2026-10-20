import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransportadoraService } from '../services/transportadoraService';
import { ContatosService } from '@/modules/bling/services/contatosService';
import { NotFoundError, ValidationError } from '@/shared/errors/AppError';
import { validateImportarTransportadoraBling } from '../transportadora.validator';

const CNPJ = '12345678000190';

const contato = (overrides: Record<string, unknown> = {}) => ({
  id: 9001,
  nome: 'JADLOG LOGISTICA',
  fantasia: 'Jadlog',
  situacao: 'A',
  numeroDocumento: '12.345.678/0001-90',
  ...overrides,
});

describe('ContatosService.buscarPorDocumento', () => {
  let http: any;
  let service: ContatosService;

  beforeEach(() => {
    http = { get: vi.fn() };
    service = new ContatosService(http);
  });

  it('usa o filtro numeroDocumento e devolve só contatos com o documento exato', async () => {
    http.get.mockResolvedValueOnce({ data: [contato(), contato({ id: 2, numeroDocumento: '99999999000199' })] });

    const encontrados = await service.buscarPorDocumento('12.345.678/0001-90');

    expect(http.get).toHaveBeenCalledWith(`/contatos?numeroDocumento=${CNPJ}`, undefined, undefined);
    expect(encontrados.map((c) => c.id)).toEqual([9001]);
  });

  it('não confunde filtro ignorado pelo Bling (contatos quaisquer) com resultado; tenta a pesquisa textual', async () => {
    http.get
      .mockResolvedValueOnce({ data: [contato({ id: 1, numeroDocumento: '11111111000111' })] }) // filtro ignorado
      .mockResolvedValueOnce({ data: [contato()] });

    const encontrados = await service.buscarPorDocumento(CNPJ);

    expect(http.get).toHaveBeenNthCalledWith(2, `/contatos?pesquisa=${CNPJ}`, undefined, undefined);
    expect(encontrados.map((c) => c.id)).toEqual([9001]);
  });

  it('devolve lista vazia quando nenhum contato tem o documento', async () => {
    http.get.mockResolvedValue({ data: [contato({ numeroDocumento: '11111111000111' })] });
    expect(await service.buscarPorDocumento(CNPJ)).toEqual([]);
  });
});

describe('TransportadoraService.importarDoBlingPorDocumento', () => {
  let repo: any;
  let contatos: any;
  let service: TransportadoraService;

  beforeEach(() => {
    repo = {
      findByIdBling: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async (data: any) => ({ id: 'local-1', ...data })),
      update: vi.fn().mockImplementation(async (id: string, data: any) => ({ id, id_bling: '9001', ...data })),
    };
    contatos = {
      buscarPorDocumento: vi.fn().mockResolvedValue([contato()]),
      getById: vi.fn().mockResolvedValue(contato({ nome: 'JADLOG LOGISTICA S.A.' })),
    };
    service = new TransportadoraService(repo, {} as any, contatos);
  });

  it('cria a transportadora com os dados do contato do Bling', async () => {
    const resultado = await service.importarDoBlingPorDocumento('12.345.678/0001-90');

    expect(contatos.buscarPorDocumento).toHaveBeenCalledWith(CNPJ);
    expect(repo.create).toHaveBeenCalledWith({
      id_bling: '9001',
      nome: 'JADLOG LOGISTICA S.A.',
      fantasia: 'Jadlog',
      documento: CNPJ,
      active: true,
    });
    expect(resultado.acao).toBe('criada');
    expect(resultado.contatosEncontrados).toBe(1);
  });

  it('atualiza quando a transportadora do Bling já existe localmente', async () => {
    repo.findByIdBling.mockResolvedValue({ id: 'local-1', id_bling: '9001', nome: 'antigo' });

    const resultado = await service.importarDoBlingPorDocumento(CNPJ);

    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith('local-1', expect.objectContaining({ nome: 'JADLOG LOGISTICA S.A.', documento: CNPJ }));
    expect(resultado.acao).toBe('atualizada');
  });

  it('com vários contatos de mesmo documento, usa o primeiro ativo', async () => {
    contatos.buscarPorDocumento.mockResolvedValue([contato({ id: 1, situacao: 'I' }), contato({ id: 2, situacao: 'A' })]);
    contatos.getById.mockImplementation(async (id: string) => contato({ id: Number(id) }));

    const resultado = await service.importarDoBlingPorDocumento(CNPJ);

    expect(contatos.getById).toHaveBeenCalledWith('2');
    expect(resultado.transportadora.id_bling).toBe('2');
    expect(resultado.contatosEncontrados).toBe(2);
  });

  it('segue com os dados da busca se o detalhe do contato falhar', async () => {
    contatos.getById.mockRejectedValue(new Error('429'));

    await service.importarDoBlingPorDocumento(CNPJ);

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ nome: 'JADLOG LOGISTICA' }));
  });

  it('erro claro quando o Bling não tem contato com o documento', async () => {
    contatos.buscarPorDocumento.mockResolvedValue([]);
    await expect(service.importarDoBlingPorDocumento(CNPJ)).rejects.toThrow(NotFoundError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('recusa documento inválido sem consultar o Bling', async () => {
    await expect(service.importarDoBlingPorDocumento('123')).rejects.toThrow(ValidationError);
    expect(contatos.buscarPorDocumento).not.toHaveBeenCalled();
  });
});

describe('validateImportarTransportadoraBling', () => {
  it('aceita CNPJ/CPF com ou sem pontuação e recusa o resto', () => {
    expect(validateImportarTransportadoraBling({ documento: '12.345.678/0001-90' })).toEqual({ documento: '12.345.678/0001-90' });
    expect(validateImportarTransportadoraBling({ documento: '12345678909' })).toEqual({ documento: '12345678909' });
    expect(() => validateImportarTransportadoraBling({ documento: '1234' })).toThrow('Dados inválidos');
    expect(() => validateImportarTransportadoraBling({})).toThrow('Dados inválidos');
  });
});
