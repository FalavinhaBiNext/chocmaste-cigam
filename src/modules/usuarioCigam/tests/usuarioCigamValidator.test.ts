import { describe, it, expect } from 'vitest';
import { validateCreateUsuarioCigam } from '../usuarioCigam.validator';

describe('UsuarioCigamValidator', () => {
  it('accept valid input', () => {
    expect(() => validateCreateUsuarioCigam({
      ambiente: 'producao',
      login: 'usuario1',
      senha: 'senha123',
      url_ambiente: 'https://cigam.example.com',
    })).not.toThrow();
  });

  it('reject missing ambiente', () => {
    expect(() => validateCreateUsuarioCigam({
      login: 'u', senha: 's', url_ambiente: 'url',
    })).toThrow('Dados inválidos.');
  });

  it('reject missing login', () => {
    expect(() => validateCreateUsuarioCigam({
      ambiente: 'prod', senha: 's', url_ambiente: 'url',
    })).toThrow('Dados inválidos.');
  });

  it('reject missing senha', () => {
    expect(() => validateCreateUsuarioCigam({
      ambiente: 'prod', login: 'u', url_ambiente: 'url',
    })).toThrow('Dados inválidos.');
  });

  it('reject missing url_ambiente', () => {
    expect(() => validateCreateUsuarioCigam({
      ambiente: 'prod', login: 'u', senha: 's',
    })).toThrow('Dados inválidos.');
  });

  it('reject null', () => {
    expect(() => validateCreateUsuarioCigam(null)).toThrow('Dados inválidos');
  });
});
