import { Client, Wallet } from 'xrpl';
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
  const wallet = Wallet.fromSeed(walletSecret);

  const client = await initClient(server);

  const res = await client.submitAndWait(
    {
      ...tx,
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
  const client = await initClient(server);

  const nfts = await client.request<ListNftsReq, ListNftsRes>({
    command: 'account_nfts',
    account: walletAddress,
  });

  await client.disconnect();

  return nfts.result.account_nfts;
};
