import { describe, it, expect } from 'vitest';
import { formatarCepCigam } from '../cep';

describe('formatarCepCigam', () => {
  it('deve formatar CEP numérico de 8 dígitos para o padrão XXXXX-XXX', () => {
    expect(formatarCepCigam('02936150')).toBe('02936-150');
    expect(formatarCepCigam('38041100')).toBe('38041-100');
    expect(formatarCepCigam('01001000')).toBe('01001-000');
  });

  it('deve manter CEP já formatado com hífen', () => {
    expect(formatarCepCigam('02936-150')).toBe('02936-150');
    expect(formatarCepCigam('38041-100')).toBe('38041-100');
  });

  it('deve lidar com caracteres extras como pontos e espaços', () => {
    expect(formatarCepCigam('02.936-150')).toBe('02936-150');
    expect(formatarCepCigam(' 02936150 ')).toBe('02936-150');
  });

  it('deve retornar string vazia para valores nulos, indefinidos ou vazios', () => {
    expect(formatarCepCigam('')).toBe('');
    expect(formatarCepCigam(null)).toBe('');
    expect(formatarCepCigam(undefined)).toBe('');
  });

  it('deve retornar o valor limpo se o tamanho for diferente de 8 dígitos', () => {
    expect(formatarCepCigam('12345')).toBe('12345');
  });
});
