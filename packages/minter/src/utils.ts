import { convertStringToHex } from 'xrpl';
import log from 'loglevel';
import chalk from 'chalk';
import axios from 'axios';
import type { AxiosPromise } from 'axios';
import { Schema, Validators, validate } from 'tiny-validation';
import { MetadataInfo } from './models/nft-minter';

export function isError(e: unknown): e is Error {
  return e instanceof Error;
}

const schema: Schema = {
  name: [Validators.isPresent()],
  description: [Validators.isPresent()],
  image: [Validators.isPresent()],
  properties: [Validators.isPresent()],
};

function validateMetaResponse(res?: unknown): res is MetadataInfo {
  if (!res) return false;
  const result = validate(schema, res as Record<string, unknown>);
  result.fold(
    e => {
      log.error(
        chalk.red('\n error validating meta response from IFPS –'),
        e,
        '\n'
      );
      throw new Error('Meta data not valid');
    },
    x => log.debug(chalk.greenBright('Found meta data from IFPS – '), x)
  );
  return !result.isFail;
}

export async function getIpfsMeta(
  cid: string
): Promise<AxiosPromise<MetadataInfo>> {
  const res = await axios(`https://gateway.pinata.cloud/ipfs/${cid}`);
  validateMetaResponse(res.data);
  return res;
}

export function ctiEncode(
  txn_hash: string /* hex string */,
  txn_index: number,
  ledger_hash: string /* hex string */,
  ledger_index: number
) {
  const ledgerCheck = BigInt(Number.parseInt(ledger_hash.slice(0, 1), 16));
  const txnCheck = BigInt(Number.parseInt(txn_hash.slice(0, 1), 16));
  let cti = (ledgerCheck << 4n) + txnCheck;
  cti <<= 16n;
  cti += BigInt(String(txn_index));
  cti <<= 32n;
  cti += BigInt(String(ledger_index));

  log.debug(
    chalk.greenBright(`\nCTI ${cti} created from the following values:\n`)
  );
  log.debug({ txn_hash, txn_index, ledger_hash, ledger_index });

  return cti;
}

export function generateCurrencyCode(cti: BigInt, nftName: string) {
  const nftIdentifier = '02';
  const ctiHex = cti.toString(16);
  if (nftName.length > 12) {
    throw new Error('Nft name too long');
  }
  let nftHex = convertStringToHex(nftName);

  while (nftHex.length < 24) {
    nftHex = '0' + nftHex;
  }
  const currencyCode =
    nftIdentifier + ctiHex.toUpperCase() + nftHex.toUpperCase();
  log.debug(chalk.greenBright(`\ncurrency code ${currencyCode} created`));
  return currencyCode;
}

const isTestnet = (uri: string) => uri.includes('test');

export function determineBithompUri(connectionUri: string) {
  const baseUri = new URL('https://bithomp.com');
  baseUri.pathname = '/explorer';

  if (isTestnet(connectionUri)) {
    baseUri.hostname = 'test.bithomp.com';
  }
  return baseUri.toString();
}

export function determineXrplArtUri(
  connectionUri: string,
  issuerWallet: string,
  nftName: string
) {
  const baseUri = new URL('https://xrplnft.art/');
  baseUri.pathname = `/${
    isTestnet(connectionUri) ? 'testnet' : 'mainnet'
  }/nft-data/${issuerWallet}/${nftName}`;

  return baseUri.toString();
}

// function ctiIsSimple(cti) {
//   return cti >> 56n == 0;
// }

// function ctiTransactionIndex(cti) {
//   return (cti >> 32n) & 0xffffn;
// }

// function ctiLedgerIndex(cti) {
//   return cti & 0xffffffffn;
// }

// function ctiLedgerCheck(cti) {
//   return (cti >> 52n) & 0xfn;
// }

// function ctiTransactionCheck(cti) {
//   return (cti >> 48n) & 0xfn;
// }
