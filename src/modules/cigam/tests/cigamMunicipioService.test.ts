import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { CigamMunicipioService } from '../services/cigamMunicipioService';

vi.mock('axios');
vi.mock('../services/cigamHttpClient', () => ({
  CigamHttpClient: class {},
}));
vi.mock('@/modules/usuarioCigam/services/usuarioCigamService', () => ({
  UsuarioCigamService: class {},
}));

describe('CigamMunicipioService', () => {
  let service: CigamMunicipioService;
  let cigamHttpClient: any;
  let usuarioCigamService: any;

  const mockMunicipios = [
    {
      NomeMunicipio: 'MOJI MIRIM                    ',
      UF: 'SP',
      Codigo: '3530805   ',
      CodigoPais: '031',
    },
    {
      NomeMunicipio: 'BIRITIBA-MIRIM                ',
      UF: 'SP',
      Codigo: '3506607   ',
      CodigoPais: '031',
    },
    {
      NomeMunicipio: 'SANTO ANDRE                   ',
      UF: 'SP',
      Codigo: '3547809   ',
      CodigoPais: '031',
    },
    {
      NomeMunicipio: 'UBERABA                       ',
      UF: 'MG',
      Codigo: '3170107   ',
      CodigoPais: '031',
    },
  ];

  beforeEach(() => {
    cigamHttpClient = {
      get: vi.fn().mockResolvedValue(mockMunicipios),
    };
    usuarioCigamService = {
      findAll: vi.fn().mockResolvedValue([{ ativo: true, ambiente: 'producao' }]),
      findByEnv: vi.fn().mockResolvedValue({ url_ambiente: 'https://cigam.test' }),
    };

    service = new CigamMunicipioService(cigamHttpClient, usuarioCigamService);
  });

  it('resolves exact match with accent normalization', async () => {
    const result = await service.resolverMunicipio('Santo André', 'SP');
    expect(result).toBe('SANTO ANDRE');
  });

  it('resolves alphanumeric match ignoring hyphens', async () => {
    const result = await service.resolverMunicipio('Biritiba Mirim', 'SP');
    expect(result).toBe('BIRITIBA-MIRIM');
  });

  it('resolves phonetic variation G vs J (Mogi Mirim -> MOJI MIRIM)', async () => {
    const result = await service.resolverMunicipio('Mogi Mirim', 'SP');
    expect(result).toBe('MOJI MIRIM');
  });

  it('resolves via ViaCEP and IBGE code when city name has unusual spelling or district', async () => {
    (axios.get as any).mockResolvedValueOnce({
      data: { ibge: '3530805' },
    });

    const result = await service.resolverMunicipio('Distrito Desconhecido', 'SP', '13803370');
    expect(result).toBe('MOJI MIRIM');
  });

  it('falls back to cleaned city name when not found and no IBGE match', async () => {
    (axios.get as any).mockRejectedValueOnce(new Error('Network error'));

    const result = await service.resolverMunicipio('Cidade Inexistente', 'SP', '99999999');
    expect(result).toBe('CIDADE INEXISTENTE');
  });
});
