/**
 * Script de verificação e teste da integração da Tray no backend Chocmaster.
 * Execução: npx ts-node -r tsconfig-paths/register scripts/test-tray-auth.ts
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { container } from '@/shared/container';
import { TrayTokenRepository } from '@/modules/tray/repositories/trayTokenRepository';
import { TrayHttpClient } from '@/modules/tray/services/trayHttpClient';
import { TrayAuthService } from '@/modules/tray/services/trayAuthService';

async function main() {
  console.log('='.repeat(65));
  console.log(' 🍫 VERIFICAÇÃO DA INTEGRAÇÃO TRAY - BACKEND CHOCMASTER');
  console.log('='.repeat(65));

  const tokenRepo = container.resolve(TrayTokenRepository);
  const authService = container.resolve(TrayAuthService);
  const httpClient = container.resolve(TrayHttpClient);

  // 1. Verifica variáveis de ambiente
  console.log('\n[1] Verificando variáveis de ambiente:');
  console.log('• TRAY_CONSUMER_KEY:', process.env.TRAY_CONSUMER_KEY ? `${process.env.TRAY_CONSUMER_KEY.slice(0, 10)}...` : 'NÃO CONFIGURADO');
  console.log('• TRAY_CONSUMER_SECRET:', process.env.TRAY_CONSUMER_SECRET ? 'CONFIGURADO (oculto)' : 'NÃO CONFIGURADO');
  console.log('• TRAY_CALLBACK_URL:', process.env.TRAY_CALLBACK_URL || 'NÃO CONFIGURADO');
  console.log('• TRAY_STORE_DOMAIN:', process.env.TRAY_STORE_DOMAIN || '(vazio - pode ser informado na chamada)');

  // Verifica se o usuário solicitou importar o token de homologação
  const importFlag = process.argv.includes('--import-homologation');
  const homologationTokenPath = path.resolve(__dirname, '../../Homologacao_chocmaster/.tray_tokens.json');

  if (importFlag) {
    const fs = await import('fs');
    if (fs.existsSync(homologationTokenPath)) {
      console.log('\n📥 Importando tokens de homologação para o PostgreSQL...');
      const homologationData = JSON.parse(fs.readFileSync(homologationTokenPath, 'utf-8'));
      const cleanAddress = homologationData.api_host.replace(/^https?:\/\//, '').replace(/\/+$/, '');

      await tokenRepo.deactivateAll();
      await tokenRepo.save({
        store_id: String(homologationData.store_id),
        api_address: cleanAddress,
        consumer_key: process.env.TRAY_CONSUMER_KEY || '',
        access_token: homologationData.access_token,
        refresh_token: homologationData.refresh_token,
        date_expiration_access_token: new Date(homologationData.date_expiration_access_token),
        date_expiration_refresh_token: new Date(homologationData.date_expiration_refresh_token),
        date_activated: homologationData.date_activated ? new Date(homologationData.date_activated) : null,
      });
      await tokenRepo.setActive(String(homologationData.store_id));
      console.log('✅ Token importado e ativado com sucesso no PostgreSQL!');
    } else {
      console.warn(`⚠️ Arquivo ${homologationTokenPath} não encontrado.`);
    }
  }

  // 2. Verifica tokens no PostgreSQL
  console.log('\n[2] Consultando tokens ativos no banco de dados PostgreSQL:');
  const activeToken = await tokenRepo.findActive();

  if (!activeToken) {
    console.log('⚠️  Nenhum token ativo no banco PostgreSQL.');
    
    // Verifica se há domínio configurado para gerar URL
    const domain = process.env.TRAY_STORE_DOMAIN || 'minhaloja.com.br';
    if (process.env.TRAY_CONSUMER_KEY && process.env.TRAY_CALLBACK_URL) {
      const authUrl = authService.generateAuthURL(domain);
      console.log('\n👉 Para autorizar a loja via navegador, acesse a URL:');
      console.log(authUrl);
      console.log('\nApós autorizar, a Tray redirecionará para seu endpoint de callback configurado:');
      console.log(`${process.env.TRAY_CALLBACK_URL}?code=...&api_address=...`);
      console.log('\n💡 Dica: Para importar o token de homologação existente para testes imediatos, execute:');
      console.log('npx ts-node --transpile-only -r tsconfig-paths/register scripts/test-tray-auth.ts --import-homologation');
    }
    process.exit(0);
  }

  console.log('✅ Token ativo encontrado no banco de dados!');
  console.log(`• Store ID: ${activeToken.store_id}`);
  console.log(`• API Address: ${activeToken.api_address}`);
  console.log(`• Expiração Access Token: ${activeToken.date_expiration_access_token}`);
  console.log(`• Expiração Refresh Token: ${activeToken.date_expiration_refresh_token}`);

  // 3. Teste de chamada real à API Tray
  console.log('\n[3] Testando chamada à API da Tray via TrayHttpClient (/products)...');
  try {
    const productsResponse: any = await httpClient.get('/products', { params: { limit: 2 } });
    const count = productsResponse?.Products?.length || 0;
    console.log(`✅ Chamada realizada com sucesso! Produtos retornados: ${count}`);
  } catch (error: any) {
    console.error(`❌ Erro ao chamar API da Tray: ${error.message}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
