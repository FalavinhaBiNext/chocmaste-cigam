import axios from 'axios';
import https from 'https';

async function main() {
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });
  const urls = [
    'https://chmastersportais.cigam.cloud/api/Help/Api/POST-api-comercial-fa-Pedido-Salvar',
    'https://chmastersportais.cigam.cloud/api/Help/ResourceModel?modelName=PedidoDTO',
    'https://chmastersportais.cigam.cloud/api/Help/Api/POST-api-comercial-fa-Pedido-SalvarItemPedido',
    'https://chmastersportais.cigam.cloud/api/Help/ResourceModel?modelName=ItemPedidoDTO',
  ];

  for (const url of urls) {
    try {
      const resp = await axios.get(url, { httpsAgent, timeout: 10000 });
      console.log(`\nURL: ${url}`);
      // Vamos extrair as tabelas de parâmetros
      const text = resp.data;
      const regex = /<table[\s\S]*?<\/table>/gi;
      const tables = text.match(regex);
      if (tables) {
        tables.forEach((t: string) => {
          // Limpa tags html para ver campos
          const clean = t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          console.log('TABLE:', clean.slice(0, 1000));
        });
      } else {
        console.log('HTML recebido (primeiros 500 chars):', text.slice(0, 500));
      }
    } catch(e: any) {
      console.log(`Erro ao acessar ${url}:`, e.message);
    }
  }
}
main();
