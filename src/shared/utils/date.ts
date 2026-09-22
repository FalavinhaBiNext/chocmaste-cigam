/**
 * Normaliza e valida valores para colunas DATEONLY (tipo DATE no PostgreSQL).
 * Trata formatos comuns que causavam "invalid input syntax for type date: Invalid date":
 * - 'YYYY-MM-DD' -> 'YYYY-MM-DD'
 * - 'DD/MM/YYYY' -> 'YYYY-MM-DD'
 * - '0000-00-00', '', 'Invalid date', null, undefined -> null
 */
export function parseDateOnly(value?: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  if (!str || str === '0000-00-00' || str === 'Invalid date') return null;

  // Se já for YYYY-MM-DD (ou ISO YYYY-MM-DDTHH:mm:ss...)
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }

  // Se for formato brasileiro DD/MM/YYYY ou DD/MM/YYYY HH:mm:ss (comum no CIGAM)
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const parts = str.split('/');
    const dia = parts[0];
    const mes = parts[1];
    const ano = parts[2].slice(0, 4);
    return `${ano}-${mes}-${dia}`;
  }

  const date = new Date(str);
  if (isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}
