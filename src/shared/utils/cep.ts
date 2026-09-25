/**
 * Formata um CEP para o padrão esperado pela API do CIGAM (XXXXX-XXX).
 *
 * O parser interno do CIGAM (POST /API/api/genericos/ge/Pessoa/Salvar) espera
 * o hífen no 6º caractere. Se receber 8 dígitos numéricos sem hífen, ele
 * descarta o 6º caractere e corrompe o número do CEP gravado no banco de dados.
 */
export function formatarCepCigam(cep?: string | null): string {
  if (!cep) return '';
  const clean = cep.replace(/\D/g, '');
  if (clean.length === 8) {
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  }
  return cep.trim();
}
