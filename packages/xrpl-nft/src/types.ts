import type * as xrpl from 'xrpl';

// ************* Base Types *************

interface Warning {
  id: number;
  message: string;
  details?: {
    [key: string]: string;
  };
}

interface BaseResponse {
  id: number | string;
  status?: 'success' | string;
  type: 'response' | string;
  result: unknown;
  warning?: 'load';
  warnings?: Warning[];
  forwarded?: boolean;
  api_version?: number;
}

// ************* Mint NFTS *************

interface MintConfig
  extends Omit<xrpl.NFTokenMint, 'Account' | 'TransactionType'> {
  /**
   * The Secret of the account that is minting the token. The account MUST either:
   *    - match the Issuer field in the NFToken object
   *    - match the MintAccount field in the AccountRoot of the Issuer field.
   */
  walletSecret: string;
}

export type MintFn = (
  server: string,
  config: MintConfig
) => Promise<xrpl.TxResponse>;

// ************* ListNFTs for account *************

export interface NFT {
  Flags: number;
  Issuer: string;
  TokenID: string;
  TokenTaxon: number;
  URI: string;
  nft_serial: number;
}

export type ListNftsReq = {
  command: 'account_nfts';
  account: string;
};

export type ListNftsRes = BaseResponse & {
  result: {
    account_nfts: NFT[];
  };
};

export type ListNftsForAccountFn = (
  server: string,
  walletAddress: string
) => Promise<NFT[]>;

export interface ModifiedNode {
  ModifiedNode: {
    LedgerEntryType: string;
    LedgerIndex: string;
    FinalFields?: {
      [field: string]: unknown;
    };
    PreviousFields?: {
      [field: string]: unknown;
    };
    PreviousTxnID?: string;
    PreviouTxnLgrSeq?: number;
  };
}

export interface NonFungibleToken {
  NonFungibleToken: {
    TokenID: string;
    URI: string;
  };
}
