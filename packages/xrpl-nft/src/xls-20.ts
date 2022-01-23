import { Client, Wallet, convertStringToHex, TxResponse, TransactionMetadata } from 'xrpl';
import invariant from 'tiny-invariant';
import type {
  ListNftsForAccountFn,
  ListNftsReq,
  ListNftsRes,
  MintFn,
  NFT,
  ModifiedNode
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

  const res: TxResponse = await client.submitAndWait(
    {
      ...tx,
      ...(tx.URI && { URI: convertStringToHex(tx.URI) }),
      TransactionType: 'NFTokenMint',
      Account: wallet.classicAddress,
    },
    { wallet }
  );

  const resMeta = res.result.meta as TransactionMetadata;

  const filteredNode = resMeta.AffectedNodes.find(node => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if(node.ModifiedNode.LedgerEntryType === "NFTokenPage"){
      return true;
    }
  }) as ModifiedNode

  const currentNfts: NFT[] = filteredNode.ModifiedNode.FinalFields?.NonFungibleTokens as NFT[]
  const previousNfts: NFT[] = filteredNode.ModifiedNode.PreviousFields?.NonFungibleTokens as NFT[]

  let difference = "";

  currentNfts.forEach(nft => {     
      if (!previousNfts.some(nft2 => nft2.NonFungibleToken.TokenID === nft.NonFungibleToken.TokenID)) {
        difference = nft.NonFungibleToken.TokenID; 
      }
    });
  
  console.log(difference);

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
