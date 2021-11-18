import * as xrpl from 'xrpl';
import dotenv from 'dotenv';
dotenv.config();

export interface MinterConfig {
  gravatar: string;
  domainName: string;
  metadata: string;
  issuingWallet: string;
  issuingWalletSecret: string;
  hotWalletAddress: string;
  hotWalletSecret: string;
}

export class NftMinter {
  #gravatar: string;
  #domainName: string;
  #metadata: string;
  #issuingWallet: xrpl.Wallet | null;
  #hotWalletAddress: string;
  #hotWalletSecret: string;
  #xrplClient: xrpl.Client;

  constructor({
    gravatar,
    domainName,
    metadata,
    hotWalletAddress,
    hotWalletSecret,
  }: MinterConfig) {
    this.#gravatar = gravatar;
    this.#domainName = domainName;
    this.#metadata = metadata;
    this.#issuingWallet = null;
    this.#hotWalletAddress = hotWalletAddress;
    this.#hotWalletSecret = hotWalletSecret;
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
    console.log(
      'Issuing account successfully created with classic address of: ' +
        this.#issuingWallet
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

      console.log('Response for successful Account set tx');
      console.log(response);
    }
  }

  async disconnectClient() {
    await this.#xrplClient.disconnect();
    console.log('Client disconnected');
  }
}
