import * as xrpl from 'xrpl';
import dotenv from 'dotenv';
import { LedgerEntry } from 'xrpl';

dotenv.config();

export interface MinterConfig {
  gravatar?: string;
  domainName: string;
  metadata: string;
  issuingWallet: string;
  issuingWalletSecret: string;
  server?: string;
}

export class NftMinter {
  #gravatar?: string;

  #domainName: string;

  #metadata: string;

  #issuingWallet?: xrpl.Wallet;

  #distributorWallet?: xrpl.Wallet;

  #xrplClient: xrpl.Client;

  constructor({ gravatar, domainName, metadata, server }: MinterConfig) {
    this.#gravatar = gravatar;
    this.#domainName = domainName;
    this.#metadata = metadata;
    this.#issuingWallet = undefined;
    this.#distributorWallet = undefined;
    this.#xrplClient = new xrpl.Client(
      process.env.XRPL_NET || 'wss://s.altnet.rippletest.net/'
    );
  }

  async connectClient() {
    await this.#xrplClient.connect();
    console.log('Client connected');
  }

  async createAccount() {
    const response = await this.#xrplClient.fundWallet();
    this.#issuingWallet = response.wallet;
    console.log('Issuing account successfully created');
    console.log('Issuing wallet: ' + this.#issuingWallet.classicAddress);
  }

  async createDistributorAccount() {
    const response = await this.#xrplClient.fundWallet();
    this.#distributorWallet = response.wallet;
    console.log('Distributor account successfully created');
    console.log(
      'Distributor wallet: ' + this.#distributorWallet.classicAddress
    );
  }

  async accountSet() {
    if (this.#issuingWallet) {
      const tx: xrpl.AccountSet = {
        TransactionType: 'AccountSet',
        Account: this.#issuingWallet.classicAddress,
        Domain: this.#domainName,
        EmailHash: this.#gravatar,
        Fee: '12',
        SetFlag: 8,
      };
      const response = await this.#xrplClient.submitAndWait(tx, {
        wallet: this.#issuingWallet,
      });
      console.log(
        `Response for successful Account set tx: ${response.result.Account}`
      );
    }
  }

  async getLedger() {
    const tx: xrpl.LedgerRequest = {
      id: '22951799',
      command: 'ledger',
      ledger_index: 'validated',
      full: false,
      accounts: false,
      transactions: false,
      expand: false,
      owner_funds: false,
    };
    const tague = await this.#xrplClient.request(tx);
    console.log(tague);
  }

  #createMemo(memoData: string, memoFormat: string, memoType: string) {
    return {
      Memo: {
        MemoData: xrpl.convertStringToHex(memoData),
        MemoFormat: xrpl.convertStringToHex(memoFormat),
        MemoType: xrpl.convertStringToHex(memoType),
      },
    };
  }

  async sendCertification() {
    if (this.#issuingWallet && this.#distributorWallet) {
      const tx: xrpl.Payment = {
        Account: this.#issuingWallet.classicAddress,
        Amount: '10000',
        Destination: this.#distributorWallet.classicAddress,
        TransactionType: 'Payment',
        Memos: [
          this.#createMemo(
            'A fantastic NFT carefully curated and designed by Tague',
            'text/plain',
            'Description'
          ),
          this.#createMemo('Tague', 'text/plain', 'Author'),
          this.#createMemo(
            'hash:QmQGjvaEaShcxKQtDavafgYgLu3N44db9MBtbWUE2tQ1WQ',
            'text/uri',
            'PrimaryUri'
          ),
        ],
      };
      const payment = await this.#xrplClient.submitAndWait(tx, {
        wallet: this.#issuingWallet,
      });
      console.log({ payment });
      await this.getLedger();
    }
  }

  async disconnectClient() {
    await this.#xrplClient.disconnect();
    console.log('Client disconnected');
  }
}
