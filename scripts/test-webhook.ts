import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { container } from '../src/shared/container';
import { WebhookService } from '../src/modules/bling/services/webhookService';
import { BlingRepository } from '../src/modules/bling/repositories/blingRepository';

const payload = {
  eventId: "019e82e6-8860-7827-ac9e-067af654e358",
  date: "2026-06-01T11:16:46Z",
  version: "v1",
  event: "order.created",
  companyId: "f46afdc1cc617537a402af81c928bd37",
  data: {
    id: 25957584103,
    data: "2026-06-01",
    numero: 70911,
    numeroLoja: "305609",
    total: 198.86,
    contato: {
      id: 18172903829
    },
    vendedor: {
      id: 0
    },
    loja: {
      id: 203345026
    },
    situacao: {
      id: 6,
      valor: 0
    }
  }
};

async function run() {
  console.log('--- Iniciando teste do webhook Bling -> CIGAM ---');
  try {
    // 1. Injetar o token fornecido pelo usuário no banco local
    const blingRepository = container.resolve(BlingRepository);
    const existing = await blingRepository.findActive();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Expira em 1 ano

    const tokenData = {
      access_token: 'cdff7611eee1d4f7c3f9065310680d70845fb5ba',
      refresh_token: 'mock_refresh_token',
      expires_at: expiresAt,
      scope: 'all',
      token_type: 'Bearer',
      client_id: process.env.BLING_CLIENT_ID || 'mock_client_id',
      client_secret: process.env.BLING_CLIENT_SECRET || 'mock_client_secret',
      active: true
    };

    if (existing) {
      await blingRepository.update(existing.id, tokenData);
      console.log('Token Bling ativo atualizado no banco local.');
    } else {
      await blingRepository.save(tokenData);
      console.log('Token Bling ativo salvo no banco local.');
    }

    // 2. Chamar o serviço de webhook para processamento
    const webhookService = container.resolve(WebhookService);
    await webhookService.processarPedidoCriado(payload as any);
    console.log('--- Teste concluído com sucesso! ---');
  } catch (error: any) {
    console.error('--- Teste falhou com erro: ---');
    console.error(error);
  }
}

run();
