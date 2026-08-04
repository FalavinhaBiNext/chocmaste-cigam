import { describe, it, expect } from 'vitest';
import { validateAuthenticate, validateSaveToken, validateSync } from '../cigam.validator';

describe('Cigam Validators', () => {
  describe('validateAuthenticate', () => {
    it('accept valid input', () => {
      expect(() => validateAuthenticate({ ambiente: 'producao' })).not.toThrow();
    });

    it('reject missing ambiente', () => {
      expect(() => validateAuthenticate({})).toThrow('Dados inválidos.');
    });

    it('reject null', () => {
      expect(() => validateAuthenticate(null)).toThrow('Dados inválidos.');
    });
  });

  describe('validateSync', () => {
    it('accept valid input', () => {
      expect(() => validateSync({ ambiente: 'producao' })).not.toThrow();
    });

    it('reject missing ambiente', () => {
      expect(() => validateSync({})).toThrow('Dados inválidos.');
    });

    it('reject null', () => {
      expect(() => validateSync(null)).toThrow('Dados inválidos.');
    });
  });

  describe('validateSaveToken', () => {
    it('accept valid input', () => {
      expect(() => validateSaveToken({ hash: 'hash-123', ambiente: 'producao' })).not.toThrow();
    });

    it('reject missing hash', () => {
      expect(() => validateSaveToken({ ambiente: 'producao' })).toThrow('Dados do token inválidos.');
    });

    it('reject missing ambiente', () => {
      expect(() => validateSaveToken({ hash: 'h' })).toThrow('Dados do token inválidos.');
    });

    it('default active=true', () => {
      const r = validateSaveToken({ hash: 'h', ambiente: 'producao' });
      expect(r.active).toBe(true);
    });
  });
});
