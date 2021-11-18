//@ts-ignore
import { NftMinter, MinterConfig } from '../src';

describe('index', () => {
  describe('myPackage', () => {
    it('should return a string containing the message', () => {
      const message = 'Hello';

      const result = new NftMinter({} as MinterConfig);

      expect(result).toMatch(message);
    });
  });
});
