import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlingOAuthService } from '../services/blingOAuthService';
import { BlingRepository } from '../repositories/blingRepository';

// Mock do axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock do repositório
const mockBlingRepository = {
  findActive: vi.fn(),
  findAll: vi.fn(),
  findByNomeUnidade: vi.fn(),
  findByCompanyIdBling: vi.fn(),
  deactivateAll: vi.fn(),
  findById: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
};

describe('BlingOAuthService - Restrição de Uma Conta', () => {
  let service: BlingOAuthService;
  let axiosPost: any;
  let axiosGet: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    service = new BlingOAuthService(mockBlingRepository as any);
    
    const axios = await import('axios');
    axiosPost = axios.default.post;
    axiosGet = axios.default.get;
  });

  it('deve desativar todas as contas antes de salvar uma nova', async () => {
    // Mock do axios para simular resposta do Bling
    axiosPost.mockResolvedValue({
      data: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        scope: 'all',
        token_type: 'Bearer',
      },
    });

    axiosGet.mockResolvedValue({
      data: {
        data: {
          company: { id: 'company-123' },
        },
      },
    });

    // Mock do repositório
    mockBlingRepository.findByCompanyIdBling.mockResolvedValue(null);
    mockBlingRepository.save.mockResolvedValue({
      id: '1',
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      active: true,
    });

    // Chamar o método
    await service.exchangeCode('test-code', 'client-id', 'client-secret');

    // Verificar se deactivateAll foi chamado antes de save
    expect(mockBlingRepository.deactivateAll).toHaveBeenCalledTimes(1);
    expect(mockBlingRepository.save).toHaveBeenCalledTimes(1);

    // Verificar ordem das chamadas
    const deactivateCall = mockBlingRepository.deactivateAll.mock.invocationCallOrder[0];
    const saveCall = mockBlingRepository.save.mock.invocationCallOrder[0];
    expect(deactivateCall).toBeLessThan(saveCall);
  });

  it('deve atualizar token existente da mesma empresa após desativar todas', async () => {
    // Mock do axios para simular resposta do Bling
    axiosPost.mockResolvedValue({
      data: {
        access_token: 'updated-access-token',
        refresh_token: 'updated-refresh-token',
        expires_in: 3600,
        scope: 'all',
        token_type: 'Bearer',
      },
    });

    axiosGet.mockResolvedValue({
      data: {
        data: {
          company: { id: 'company-123' },
        },
      },
    });

    // Mock do repositório - simula token existente
    mockBlingRepository.findByCompanyIdBling.mockResolvedValue({
      id: 'existing-token-id',
      company_id_bling: 'company-123',
      active: true,
    });
    mockBlingRepository.update.mockResolvedValue({
      id: 'existing-token-id',
      access_token: 'updated-access-token',
      active: true,
    });

    // Chamar o método
    await service.exchangeCode('test-code', 'client-id', 'client-secret');

    // Verificar se deactivateAll foi chamado
    expect(mockBlingRepository.deactivateAll).toHaveBeenCalledTimes(1);

    // Verificar se update foi chamado com active: true
    expect(mockBlingRepository.update).toHaveBeenCalledWith('existing-token-id', {
      access_token: 'updated-access-token',
      refresh_token: 'updated-refresh-token',
      expires_at: expect.any(Date),
      scope: 'all',
      token_type: 'Bearer',
      active: true,
    });
  });
});
