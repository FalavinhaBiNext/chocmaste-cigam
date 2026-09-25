import axios from 'axios';
import https from 'https';

// =========================================================================
// SCRIPT DE TESTE: POST /API/api/genericos/ge/Pessoa/Salvar (CIGAM)
// =========================================================================
// Uso:
//   npx ts-node --transpile-only -r tsconfig-paths/register scripts/test-cigam-pessoa-salvar.ts
// Ou passando outro CEP:
//   npx ts-node --transpile-only -r tsconfig-paths/register scripts/test-cigam-pessoa-salvar.ts 02936-150
// =========================================================================

const BASE_URL = 'https://chmastersportaishml.cigam.cloud';
const ENDPOINT_LOGIN = `${BASE_URL}/API/api/genericos/ge/Login/Autenticar`;
const ENDPOINT_SALVAR = `${BASE_URL}/API/api/genericos/ge/Pessoa/Salvar`;
const ENDPOINT_BUSCAR = `${BASE_URL}/API/api/genericos/ge/Pessoa/Buscar`;

const USERNAME = process.env.CIGAM_USER || 'SUPARCEIRO';
const PASSWORD = process.env.CIGAM_PASSWORD || '@zyba.@1';

// CEP solicitado para teste
const rawCep = process.argv[2] || '02936150';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Gera um CPF matematicamente válido para não falhar na validação do CIGAM
 */
function gerarCpfValido(): string {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const calcDig = (slice: number[]) => {
    const sum = slice.reduce((acc, val, idx) => acc + val * (slice.length + 1 - idx), 0);
    const rem = (sum * 10) % 11;
    return rem === 10 ? 0 : rem;
  };
  const d1 = calcDig(n);
  const d2 = calcDig([...n, d1]);
  return [...n, d1, d2].join('');
}

/**
 * Formata CEP no padrão XXXXX-XXX caso receba apenas 8 dígitos numéricos
 */
function formatarCep(cep: string): string {
  const clean = cep.replace(/\D/g, '');
  if (clean.length === 8) {
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  }
  return cep;
}

async function autenticar(): Promise<string> {
  console.log(`\n🔑 1. Autenticando no CIGAM Homologação...`);
  console.log(`   URL: ${ENDPOINT_LOGIN}`);
  console.log(`   Usuário: ${USERNAME}`);

  const res = await axios.post(
    ENDPOINT_LOGIN,
    { NomeUsuario: USERNAME, Senha: PASSWORD },
    { httpsAgent, headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
  );

  const hash = res.data?.hash;
  if (!hash) {
    throw new Error(`Falha na autenticação: ${JSON.stringify(res.data)}`);
  }

  console.log(`   ✅ Autenticação realizada com sucesso!`);
  return hash;
}

async function executarTeste(token: string, cepParaEnviar: string, descricao: string) {
  const cpfTeste = gerarCpfValido();

  const payload = {
    NomeCompleto: `TESTE CEP ${cepParaEnviar} - CHOCMASTER`,
    CnpjCpf: cpfTeste,
    PessoaFisica: true,
    Divisao: '10', // Padrão Cliente
    Endereco: 'RUA LUIS ANTONIO DOS SANTOS',
    Numero: '100',
    Bairro: 'VILA PENTEADO',
    Municipio: 'SAO PAULO',
    Uf: 'SP',
    Cep: cepParaEnviar,
    Telefone: '11999999999',
    Email: 'teste.cep@chocmaster.com.br',
    Ativo: true,
    CodigoPais: '031',
  };

  console.log(`\n-------------------------------------------------------------------`);
  console.log(`📤 Enviando POST para Pessoa/Salvar [${descricao}]`);
  console.log(`   CEP no Payload: "${payload.Cep}"`);
  console.log(`   CPF Gerado: ${payload.CnpjCpf}`);

  try {
    const resSalvar = await axios.post(ENDPOINT_SALVAR, payload, {
      httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      timeout: 60000,
    });

    const codigoGerado = resSalvar.data?.data?.codigoEmpresa || resSalvar.data?.Codigo;
    console.log(`   ✅ Retorno da API: ${JSON.stringify(resSalvar.data)}`);
    console.log(`   Código gerado no CIGAM: ${codigoGerado}`);

    // Consultar o cadastro no CIGAM para ver como o CEP foi gravado no banco de dados
    await new Promise((r) => setTimeout(r, 2000));
    const resBuscar = await axios.get(ENDPOINT_BUSCAR, {
      httpsAgent,
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000,
    });

    const clienteNoCigam = resBuscar.data?.find((p: any) => p.CnpjCpf?.includes(cpfTeste));
    if (clienteNoCigam) {
      console.log(`   🔎 Registro localizado no CIGAM:`);
      console.log(`      - Código: ${clienteNoCigam.Codigo}`);
      console.log(`      - Nome: ${clienteNoCigam.NomeCompleto?.trim()}`);
      console.log(`      - CEP gravado no CIGAM: ${clienteNoCigam.Cep} (tipo: ${typeof clienteNoCigam.Cep})`);
    } else {
      console.log(`   ⚠️ Cliente ${codigoGerado} não encontrado na listagem imediata.`);
    }

    return {
      cepEnviado: cepParaEnviar,
      codigoGerado,
      cepGravadoNoCigam: clienteNoCigam?.Cep,
    };
  } catch (err: any) {
    console.error(`   ❌ Erro ao salvar:`, err.response?.data || err.message);
    return null;
  }
}

async function main() {
  try {
    const token = await autenticar();

    console.log(`\n===================================================================`);
    console.log(`🎯 TESTANDO COM CEP FORMATADO COM HÍFEN (Recomendado pelo CIGAM)`);
    console.log(`===================================================================`);
    const cepComHifen = formatarCep(rawCep);
    await executarTeste(token, cepComHifen, 'Com Hífen XXXXX-XXX');

    console.log(`\n===================================================================`);
    console.log(`⚠️ TESTANDO COM CEP SEM HÍFEN (Apenas números)`);
    console.log(`===================================================================`);
    const cepSemHifen = rawCep.replace(/\D/g, '');
    await executarTeste(token, cepSemHifen, 'Apenas Números XXXXXXXX');

    console.log(`\n🏁 Testes finalizados com sucesso!\n`);
  } catch (e: any) {
    console.error('Falha na execução:', e.message);
  }
}

main();
