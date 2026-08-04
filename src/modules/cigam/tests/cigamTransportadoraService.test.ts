import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CigamTransportadoraService } from '../services/cigamTransportadoraService';

describe('CigamTransportadoraService', () => {
  let service: CigamTransportadoraService;
  let cigamHttpClient: any;
  let transportadorasCigamService: any;
  let deParaRepository: any;
  let contatosService: any;

  beforeEach(() => {
    cigamHttpClient = {
      get: vi.fn().mockResolvedValue([]),
      post: vi.fn().mockResolvedValue({ Codigo: 'T001' }),
    };
    transportadorasCigamService = {
      findByIdCigam: vi.fn().mockRejectedValue(new Error('not found')),
      create: vi.fn().mockResolvedValue({ id: 'local-1' }),
    };
    deParaRepository = {
      findByIdBling: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'map-1' }),
    };
    contatosService = {
      getById: vi.fn().mockResolvedValue({
        id: 6176393350,
        nome: 'RODONAVES TRANSPORTES E ENCOMENDAS LTDA',
        situacao: 'A',
        numeroDocumento: '44914992001290',
        fantasia: 'Rodonaves',
        tipo: 'J',
        telefone: '',
        celular: '',
        email: '',
        endereco: {
          geral: {
            endereco: 'Rua Coronel Ranulfo Borges Nascimento',
            cep: '38041100',
            bairro: '',
            municipio: 'Uberaba',
            uf: 'MG',
            numero: '390',
            complemento: '',
          },
        },
      }),
    };

    service = new CigamTransportadoraService(
      cigamHttpClient,
      {
        findAll: vi.fn().mockResolvedValue([{ ativo: true, ambiente: 'producao' }]),
        findByEnv: vi.fn().mockResolvedValue({ url_ambiente: 'https://cigam.test' }),
      } as any,
      transportadorasCigamService,
      deParaRepository,
      {
        findByIdBling: vi.fn().mockResolvedValue({
          id_bling: '6176393350',
          nome: 'RODONAVES TRANSPORTES E ENCOMENDAS LTDA',
          fantasia: 'Rodonaves',
          documento: '44914992001290',
        }),
      } as any,
      contatosService,
    );
  });

  it('creates a carrier with municipality and state from the detailed Bling contact', async () => {
    await expect(service.obterOuCriarTransportadora('6176393350')).resolves.toBe('T001');

    expect(contatosService.getById).toHaveBeenCalledWith('6176393350');
    expect(cigamHttpClient.post).toHaveBeenCalledWith(
      'https://cigam.test',
      'producao',
      '/API/api/genericos/ge/Pessoa/Salvar',
      expect.objectContaining({
        NomeCompleto: 'RODONAVES TRANSPORTES E ENCOMENDAS LTDA',
        Fantasia: 'RODONAVES',
        CnpjCpf: '44914992001290',
        PessoaFisica: false,
        Divisao: '70',
        Endereco: 'RUA CORONEL RANULFO BORGES NASCIMENTO',
        Numero: '390',
        Municipio: 'UBERABA',
        Uf: 'MG',
        Cep: '38041100',
        Ativo: true,
      }),
    );
    expect(deParaRepository.create).toHaveBeenCalledWith({
      id_bling: '6176393350',
      id_cigam: 'T001',
      nome: 'RODONAVES TRANSPORTES E ENCOMENDAS LTDA',
    });
  });

  it('does not send an invalid payload when municipality or state is missing', async () => {
    contatosService.getById.mockResolvedValue({
      nome: 'Transportadora sem endereço',
      numeroDocumento: '44914992001290',
      situacao: 'A',
      tipo: 'J',
      endereco: { geral: { municipio: '', uf: '' } },
    });

    await expect(service.obterOuCriarTransportadora('6176393350')).rejects.toThrow(
      'não possui município e UF no endereço geral da Bling',
    );
    expect(cigamHttpClient.post).not.toHaveBeenCalled();
  });
});
