import type * as xrpl from 'xrpl';
import type { NonFungibleToken, ModifiedNode } from '../types';

/**
 * Retrieve the TokenID. See the [XRPL docs](https://xrpl.org/nftokenmint.html) for more information around the minting transaction.
 * @param res - The transaction response for the NFTokenMint.
 */
export const getTokenIdFromResponse = (res: xrpl.TxResponse) => {
  let tokenId = '';
  const resMeta = res.result?.meta;
  if (!resMeta || typeof resMeta === 'string') return tokenId;

  const affectedNodes = resMeta.AffectedNodes as ModifiedNode[];

  const modifiedNode = affectedNodes.find(node => {
    if (node.ModifiedNode?.LedgerEntryType === 'NFTokenPage') {
      return true;
    }
  });

  if (!modifiedNode) {
    return tokenId;
  }

  const currentNfts = modifiedNode.ModifiedNode.FinalFields
    ?.NonFungibleTokens as NonFungibleToken[];
  const previousNfts = modifiedNode.ModifiedNode.PreviousFields
    ?.NonFungibleTokens as NonFungibleToken[];

  if (!currentNfts || !previousNfts) return tokenId;

  currentNfts.forEach(currentNft => {
    if (
      !previousNfts.some(
        prevNft =>
          prevNft.NonFungibleToken.TokenID ===
          currentNft.NonFungibleToken.TokenID
      )
    ) {
      tokenId = currentNft.NonFungibleToken.TokenID;
    }
  });

  return tokenId;
};
