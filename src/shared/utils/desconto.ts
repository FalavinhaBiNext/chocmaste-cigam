/**
 * Calcula o percentual de desconto aplicado a um pedido a partir do valor
 * absoluto do desconto e do valor bruto dos produtos (antes do desconto).
 *
 * Ex.: desconto de 57,00 sobre produtos de 570,00 → 10 (%).
 *
 * O resultado é arredondado para 5 casas decimais. Retorna 0 quando não há
 * desconto ou quando a base é inválida (zero, negativa ou não numérica).
 */
const CASAS_DECIMAIS_PERCENTUAL = 5;

export function calcularPercentualDesconto(valorDesconto: number, valorBruto: number): number {
  const desconto = Number(valorDesconto) || 0;
  const base = Number(valorBruto) || 0;
  if (desconto <= 0 || base <= 0) return 0;

  return Number(((desconto / base) * 100).toFixed(CASAS_DECIMAIS_PERCENTUAL));
}
