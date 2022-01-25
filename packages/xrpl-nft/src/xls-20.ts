import { Client, Wallet, convertStringToHex } from 'xrpl';
import type * as xrpl from 'xrpl';
import invariant from 'tiny-invariant';
import type {
  ListNftsForAccountFn,
  ListNftsReq,
  ListNftsRes,
  MintFn,
} from './types';

async function initClient(server: string) {
  const client = new Client(server);
  await client.connect();
  return client;
}

/**
 * Mint a new NFT on the XRPL. See the [XRPL docs](https://xrpl.org/nftokenmint.html) for more information around the minting transaction.
 * @param server - The URL of the server to connect to.
 * @param config - Information around the transaction.
 */
export const mint: MintFn = async (server, { walletSecret, ...tx }) => {
  invariant(server, 'mint() requires a server argument');
  const wallet = Wallet.fromSeed(walletSecret);

  const client = await initClient(server);

  const res: xrpl.TxResponse = await client.submitAndWait(
    {
      ...tx,
      ...(tx.URI && { URI: convertStringToHex(tx.URI) }),
      TransactionType: 'NFTokenMint',
      Account: wallet.classicAddress,
    },
    { wallet }
  );

  await client.disconnect();
  return res;
};

/**
 * List all NFTs associated with an account.
 * @param server - The URL of the server to connect to.
 * @param walletAddress - ClassicAddress of the wallet to retreive NFTs from.
 */
export const listNftsForAccount: ListNftsForAccountFn = async (
  server,
  walletAddress
) => {
  invariant(server, 'listNftsForAccount() requires a server argument');
  invariant(
    walletAddress,
    'listNftsForAccount() requires a walletAddress argument'
  );

  const client = await initClient(server);

  const nfts = await client.request<ListNftsReq, ListNftsRes>({
    command: 'account_nfts',
    account: walletAddress,
  });

  await client.disconnect();

  return nfts.result.account_nfts;
};
