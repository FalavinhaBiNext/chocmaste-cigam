import { describe, it, expect } from 'vitest';
import { calcularPercentualDesconto } from '../desconto';

describe('calcularPercentualDesconto', () => {
  it('deve calcular o percentual a partir do valor do desconto e do valor bruto', () => {
    expect(calcularPercentualDesconto(57, 570)).toBe(10);
    expect(calcularPercentualDesconto(5, 50)).toBe(10);
    expect(calcularPercentualDesconto(25, 200)).toBe(12.5);
  });

  it('deve arredondar o percentual para 2 casas decimais', () => {
    expect(calcularPercentualDesconto(57, 2084.9)).toBe(2.73);
    expect(calcularPercentualDesconto(10, 30)).toBe(33.33);
  });

  it('deve retornar 0 quando não há desconto', () => {
    expect(calcularPercentualDesconto(0, 570)).toBe(0);
    expect(calcularPercentualDesconto(-5, 570)).toBe(0);
  });

  it('deve retornar 0 quando a base é zero, negativa ou inválida', () => {
    expect(calcularPercentualDesconto(57, 0)).toBe(0);
    expect(calcularPercentualDesconto(57, -100)).toBe(0);
    expect(calcularPercentualDesconto(57, Number.NaN)).toBe(0);
  });
});
