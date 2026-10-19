import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PedidosBlingService } from '../services/pedidosBlingService';

describe('PedidosBlingService', () => {
  let blingHttpClient: any;
  let service: PedidosBlingService;

  beforeEach(() => {
    blingHttpClient = {
      getPedido: vi.fn().mockResolvedValue({ data: { id: 25957584103, numero: 11362 } }),
      get: vi.fn(),
    };
    service = new PedidosBlingService(blingHttpClient);
  });

  it('getById busca o pedido completo no Bling', async () => {
    const pedido = await service.getById('25957584103', 'token-1');
    expect(blingHttpClient.getPedido).toHaveBeenCalledWith(25957584103, 'token-1');
    expect(pedido).toEqual({ id: 25957584103, numero: 11362 });
  });

  it('getById rejeita ID não numérico', async () => {
    await expect(service.getById('abc')).rejects.toMatchObject({ statusCode: 400 });
    expect(blingHttpClient.getPedido).not.toHaveBeenCalled();
  });

  it('getByNumero localiza o ID pelo número e busca o pedido completo', async () => {
    blingHttpClient.get.mockResolvedValue({ data: [{ id: 25957584103, numero: 11362 }] });
    const pedido = await service.getByNumero('11362');
    expect(blingHttpClient.get).toHaveBeenCalledWith('/pedidos/vendas?numero=11362', undefined, undefined);
    expect(blingHttpClient.getPedido).toHaveBeenCalledWith(25957584103, undefined);
    expect(pedido.numero).toBe(11362);
  });

  it('getByNumero retorna 404 quando o pedido não existe', async () => {
    blingHttpClient.get.mockResolvedValue({ data: [] });
    await expect(service.getByNumero('99999')).rejects.toMatchObject({ statusCode: 404 });
  });
});
