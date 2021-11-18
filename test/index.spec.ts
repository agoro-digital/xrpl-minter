import { NftMinter, MinterConfig } from '../src';

describe('index', () => {
  describe('NftMinter', () => {
    it('should exist', () => {
      const result = new NftMinter({} as MinterConfig);

      expect(result).toBeTruthy();
    });
  });
});
