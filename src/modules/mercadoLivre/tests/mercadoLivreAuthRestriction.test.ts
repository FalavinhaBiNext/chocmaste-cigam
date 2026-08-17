import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MercadoLivreAuthService } from '../services/mercadoLivreAuthService';
import { MercadoLivreTokenRepository } from '../repositories/mercadoLivreTokenRepository';

// Mock do axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock do repositório
const mockTokenRepository = {
  findActive: vi.fn(),
  findByUserId: vi.fn(),
  findAll: vi.fn(),
  save: vi.fn(),
  deactivateAll: vi.fn(),
  setActive: vi.fn(),
  deleteById: vi.fn(),
};

describe('MercadoLivreAuthService - Restrição de Uma Conta', () => {
  let service: MercadoLivreAuthService;
  let axiosPost: any;
  let axiosGet: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    service = new MercadoLivreAuthService(mockTokenRepository as any);
    
    const axios = await import('axios');
    axiosPost = axios.default.post;
    axiosGet = axios.default.get;
  });

  it('deve desativar todas as contas antes de salvar uma nova', async () => {
    // Mock do axios para simular resposta do ML
    axiosPost.mockResolvedValue({
      data: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 21600,
        scope: 'offline_access read write',
        token_type: 'Bearer',
        user_id: 123456789,
      },
    });

    axiosGet.mockResolvedValue({
      data: {
        nickname: 'test-user',
      },
    });

    // Mock do repositório
    mockTokenRepository.save.mockResolvedValue({
      id: '1',
      user_id_ml: '123456789',
      access_token: 'new-access-token',
      active: true,
    });

    // Chamar o método
    await service.exchangeCodeForToken(
      'test-code',
      'app-id',
      'client-secret',
      'http://localhost:3000/callback'
    );

    // Verificar se deactivateAll foi chamado antes de save
    expect(mockTokenRepository.deactivateAll).toHaveBeenCalledTimes(1);
    expect(mockTokenRepository.save).toHaveBeenCalledTimes(1);

    // Verificar ordem das chamadas
    const deactivateCall = mockTokenRepository.deactivateAll.mock.invocationCallOrder[0];
    const saveCall = mockTokenRepository.save.mock.invocationCallOrder[0];
    expect(deactivateCall).toBeLessThan(saveCall);

    // Verificar se setActive foi chamado após save
    expect(mockTokenRepository.setActive).toHaveBeenCalledWith('123456789');
  });

  it('deve garantir que apenas uma conta fique ativa após salvar', async () => {
    // Mock do axios para simular resposta do ML
    axiosPost.mockResolvedValue({
      data: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 21600,
        scope: 'offline_access read write',
        token_type: 'Bearer',
        user_id: 987654321,
      },
    });

    axiosGet.mockResolvedValue({
      data: {
        nickname: 'new-user',
      },
    });

    // Mock do repositório - simula que há múltiplas contas
    mockTokenRepository.save.mockResolvedValue({
      id: '1',
      user_id_ml: '987654321',
      access_token: 'new-access-token',
      active: true,
    });

    // Chamar o método
    await service.exchangeCodeForToken(
      'test-code',
      'app-id',
      'client-secret',
      'http://localhost:3000/callback'
    );

    // Verificar que deactivateAll foi chamado (desativa todas)
    expect(mockTokenRepository.deactivateAll).toHaveBeenCalledTimes(1);

    // Verificar que setActive foi chamado (ativa apenas a nova)
    expect(mockTokenRepository.setActive).toHaveBeenCalledWith('987654321');
  });
});
