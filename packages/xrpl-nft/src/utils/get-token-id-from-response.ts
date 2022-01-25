import {TxResponse, TransactionMetadata } from 'xrpl';
import type {
  NFT,
  ModifiedNode
} from '../types';

export const getTokenIdFromResponse = (res: TxResponse) => {
    const resMeta = res.result.meta as TransactionMetadata;

  const modifiedNode = resMeta.AffectedNodes.find(node => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if(node.ModifiedNode.LedgerEntryType === "NFTokenPage"){
      return true;
    }
  }) as ModifiedNode

  const currentNfts = modifiedNode.ModifiedNode.FinalFields?.NonFungibleTokens as NFT[]
  const previousNfts = modifiedNode.ModifiedNode.PreviousFields?.NonFungibleTokens as NFT[]

  let tokenId = "";

  currentNfts.forEach(nft => {     
      if (!previousNfts.some(nft2 => nft2.NonFungibleToken.TokenID === nft.NonFungibleToken.TokenID)) {
        tokenId = nft.NonFungibleToken.TokenID; 
      }
    });
  
  return tokenId
}