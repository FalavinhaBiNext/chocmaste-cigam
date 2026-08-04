import ExcelJS from 'exceljs';
import { describe, expect, it, vi } from 'vitest';
import { DeParaService } from '../services/deparaService';
import { validateDeParaExportFilter, validateDeParaExportSource } from '../depara.validator';

function createService() {
  const formaPagamentoService = {
    findAll: vi.fn().mockResolvedValue([
      { id_bling: 'b1', descricao: 'Cartão', tipo: 'credito', active: true },
      { id_bling: 'b2', descricao: 'Pix', tipo: 'pix', active: true },
    ]),
  };
  const formasPagamentoCigamService = {
    findAll: vi.fn().mockResolvedValue([
      { id_cigam: 'c1', descricao: 'Cartão', tipo: 'credito', ativo: true },
      { id_cigam: 'c2', descricao: 'Dinheiro', tipo: 'dinheiro', ativo: false },
    ]),
  };
  const mappingsRepository = {
    findAll: vi.fn().mockResolvedValue([
      { id_bling: 'b1', id_cigam: 'c1', nome: 'Cartão' },
    ]),
  };

  return new DeParaService(
    {} as any,
    {} as any,
    formaPagamentoService as any,
    {} as any,
    {} as any,
    {} as any,
    formasPagamentoCigamService as any,
    {} as any,
    {} as any,
    {} as any,
    mappingsRepository as any,
    {} as any,
  );
}

describe('DeParaService payment methods Excel export', () => {
  it.each([
    ['mapped', 'b1', 'c1', 'Sim'],
    ['unmapped', 'b2', 'c2', 'Não'],
  ] as const)('exports separated sheets using the %s filter', async (filter, blingId, cigamId, status) => {
    const buffer = await createService().generateFormasPagamentoExcel(filter);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const blingSheet = workbook.getWorksheet('Bling');
    const cigamSheet = workbook.getWorksheet('CIGAM');

    expect(blingSheet?.rowCount).toBe(2);
    expect(cigamSheet?.rowCount).toBe(2);
    expect(blingSheet?.getCell('A2').value).toBe(blingId);
    expect(cigamSheet?.getCell('A2').value).toBe(cigamId);
    expect(blingSheet?.getCell('E2').value).toBe(status);
    expect(cigamSheet?.getCell('E2').value).toBe(status);
  });

  it('defaults an empty filter to all and rejects unknown filters', () => {
    expect(validateDeParaExportFilter(undefined)).toBe('all');
    expect(() => validateDeParaExportFilter('invalid')).toThrow('Filtro de associação inválido.');
  });

  it.each(['bling', 'cigam'] as const)('exports only the requested %s worksheet', async (source) => {
    const buffer = await createService().generateFormasPagamentoExcel('all', source);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    expect(workbook.worksheets).toHaveLength(1);
    expect(workbook.worksheets[0].name).toBe(source === 'bling' ? 'Bling' : 'CIGAM');
  });

  it('validates the export source', () => {
    expect(validateDeParaExportSource(undefined)).toBe('all');
    expect(validateDeParaExportSource('bling')).toBe('bling');
    expect(() => validateDeParaExportSource('invalid')).toThrow('Origem de exportação inválida.');
  });
});
