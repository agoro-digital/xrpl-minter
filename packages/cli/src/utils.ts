import * as xrpl from 'xrpl';
import type { Faucet } from './types';

export const getFaucet = (faucet: Faucet) => {
  const faucets = new Map<Faucet, string>();
  faucets.set('testnet', 'wss://s.altnet.rippletest.net/');
  faucets.set('mainnet', 'wss://xrplcluster.com/');
  faucets.set('nftDevnet', 'wss://xls20-sandbox.rippletest.net:51233');

  return faucets.get(faucet);
};

export const isValidSeed = (seed: string) =>
  xrpl.isValidSecret(seed) || 'Invalid seed.';
