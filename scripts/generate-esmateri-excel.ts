import 'reflect-metadata';
import 'dotenv/config';
import { container } from 'tsyringe';
import '@/shared/container';
import { ProdutoService } from '@/modules/produto/services/produtoService';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

// Listagem exata das 106 colunas da planilha ESMATERI.xlsx
const columns = [
  "Cd_grupo", "Cd_sub_grupo", "Cd_material", "Centro_controle", "Descricao", "Cd_unidade_medi", 
  "campo7", "campo8", "campo10", "campo11", "Qt_minimo", "Qt_reposicao", "Pr_custo", 
  "campo14", "campo15", "campo16", "Cd_conta_gerenc", "Peso", "Pe_icms", "Pe_irrf", 
  "Pe_ipi", "Pe_frete", "Pe_embalagem", "Pe_comissao", "Pe_reajuste", "Tempo_recebimen", 
  "Tempo_preparaca", "Classificacao_f", "Dt_compra", "Dt_reajuste", "Cd_fabricante", 
  "Codigo_fabrica", "Referencia", "Cd_reduzido", "campo35", "Conversor_compr", 
  "campo37", "Pr_vista", "Pr_prazo", "Pe_encargos_fin", "Vl_frete", "Aplicacao", 
  "Cd_especif1", "Cd_especif2", "Cd_especif3", "Cd_especif4", "Cd_especif5", 
  "Cd_especif6", "Pe_royaltie", "Qt_maxima", "Dt_cadastro", "Garantia_compra", 
  "Garantia_venda", "Classificacao_a", "Qualidade_produ", "Sufixo_contabil", 
  "Cd_contabil", "Localizacao", "Tipo", "Qt_multiplo_com", "Cd_origem_merca", 
  "Qt_lote_economi", "Pr_pauta", "Qt_estoque_segu", "Qt_consumo_medi", "Conversor_venda", 
  "Cd_unidade_comp", "Cd_unidade_vend", "Peso_embalagem", "Pe_inss", "Valor_ipi", 
  "Cd_unidade_nego", "Sessao", "Usuario_modific", "Usuario_criacao", "Dt_modificacao", 
  "campo77", "campo78", "campo79", "campo80", "campo81", "campo82", "campo83", 
  "campo84", "campo85", "campo86", "campo87", "campo88", "campo89", "campo90", 
  "campo91", "campo92", "campo93", "campo94", "campo95", "campo96", "campo97", 
  "campo98", "campo99", "campo100", "campo101", "usrmate1", "usrmate2", "usrmate3", 
  "usrmate4", "usrmate5"
];

function getValueForColumn(colName: string, p: any): any {
  if (colName === 'Cd_material') {
    const code = p.codigo || p.id_bling;
    return code ? code.trim().substring(0, 20) : 'UNKNOWN';
  }
  if (colName === 'Descricao') {
    return p.nome ? p.nome.trim().substring(0, 60) : '';
  }
  if (colName === 'Cd_unidade_medi') {
    return p.unidade ? p.unidade.trim().substring(0, 3) : 'UN';
  }
  if (colName === 'Pr_custo') {
    return p.fornecedor_precoCusto || 0.00;
  }
  if (colName === 'Pr_vista' || colName === 'Pr_prazo') {
    return p.preco || 0.00;
  }
  if (colName === 'Classificacao_f') {
    const cleanNcm = p.ncm ? p.ncm.trim().replace(/\D/g, '').substring(0, 10) : '';
    return cleanNcm || null;
  }
  if (colName === 'Peso') {
    return 0.00;
  }

  // defaults
  if (colName === 'Cd_grupo') return "MR";
  if (colName === 'Cd_sub_grupo') return "14";
  if (colName === 'Centro_controle') return " ";
  if (colName === 'Tipo') return "A";
  if (colName === 'Cd_origem_merca') return 0;
  
  if (colName === 'Dt_cadastro' || colName === 'Dt_modificacao') {
    return new Date();
  }

  if (colName.startsWith('Qt_') || colName.startsWith('Pr_') || colName.startsWith('Pe_') || colName.startsWith('Vl_') || colName === 'Conversor_compr' || colName === 'Conversor_venda' || colName === 'Peso_embalagem' || colName === 'Valor_ipi') {
    return 0;
  }

  return null;
}

async function run() {
  const userHome = process.env.USERPROFILE || process.env.HOME || 'C:/Users/guilherme.oliveira';
  const downloadsDir = path.join(userHome, 'Downloads');
  
  // Localizar o template de planilha
  let templatePath = path.join(downloadsDir, 'ESMATERI.xlsx');
  if (!fs.existsSync(templatePath)) {
    templatePath = path.join(downloadsDir, 'ESMATERI (1).xlsx');
  }

  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Erro: Planilha de template não encontrada em: ${templatePath}`);
    return;
  }

  const outputPath = path.join(downloadsDir, 'produtos_esmateri_preenchido.xlsx');
  
  console.log('=== Gerador de Planilha ESMATERI (CIGAM) ===');
  console.log(`Usando template: ${templatePath}`);
  console.log('Carregando serviços...');

  try {
    const service = container.resolve(ProdutoService);
    const produtos = await service.findAll();
    
    // Filtrar apenas produtos com código preenchido
    const validProdutos = produtos.filter(p => p.codigo && p.codigo.trim() !== '');
    console.log(`Encontrados ${validProdutos.length} produtos válidos para exportação.`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      console.error('❌ Erro: Não foi possível carregar a primeira aba do Excel.');
      return;
    }

    console.log(`Preenchendo linhas na aba: ${worksheet.name}...`);

    validProdutos.forEach((p, idx) => {
      const rowNum = idx + 2; // Linha 2 em diante (linha 1 é o cabeçalho)
      const rowValues = columns.map(col => getValueForColumn(col, p));
      
      rowValues.forEach((val, colIdx) => {
        const cell = worksheet.getCell(rowNum, colIdx + 1);
        cell.value = val;
      });
    });

    console.log(`Salvando planilha gerada em: ${outputPath}...`);
    await workbook.xlsx.writeFile(outputPath);
    console.log('✅ Planilha gerada com sucesso!');

  } catch (error: any) {
    console.error('❌ Erro durante a geração da planilha:', error);
  }
}

run();
