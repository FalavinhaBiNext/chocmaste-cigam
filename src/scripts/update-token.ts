import 'reflect-metadata';
import 'dotenv/config';
import { BlingModel } from '@/modules/bling/models/blingModel';

async function main() {
  const token = await BlingModel.findOne({ where: { active: true } });

  if (!token) {
    console.log('Nenhum token ativo encontrado.');
    process.exit(1);
  }

  console.log(`Token encontrado: ${token.id}`);

  const accessToken = process.env.BLING_ACCESS_TOKEN;
  const refreshToken = process.env.BLING_REFRESH_TOKEN;
  const clientId = process.env.BLING_CLIENT_ID;
  const clientSecret = process.env.BLING_CLIENT_SECRET;

  if (!accessToken || !refreshToken) {
    console.error('BLING_ACCESS_TOKEN e BLING_REFRESH_TOKEN devem estar definidos no .env');
    process.exit(1);
  }

  await token.update({
    access_token: accessToken,
    refresh_token: refreshToken,
    access_token_url: 'https://bling.com.br/Api/v3/oauth/token',
    client_id: clientId || token.client_id,
    client_secret: clientSecret || token.client_secret,
  });

  console.log('Token atualizado com sucesso!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro ao atualizar token:', err);
  process.exit(1);
});