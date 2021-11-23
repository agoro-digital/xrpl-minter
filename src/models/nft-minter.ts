/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as xrpl from 'xrpl';
import dotenv from 'dotenv';
import { ctiEncode, generateCurrencyCode } from '../utils';

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

  #cti?: number;

  constructor({ gravatar, domainName, metadata }: MinterConfig) {
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
    const res = await this.#xrplClient.request(tx);
    return res;
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
      const {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result: { ledger_hash, ledger_index },
      } = await this.getLedger();
      this.#cti = Number(
        ctiEncode(
          payment.result.hash,
          //@ts-expect-error - error
          payment.result.meta.TransactionIndex,
          ledger_hash,
          ledger_index
        )
      );
    }
  }

  async createTrustLine() {
    const tx: xrpl.TrustSet = {
      TransactionType: 'TrustSet',
      Account: this.#distributorWallet?.classicAddress || '',
      Flags: 262144,
      LimitAmount: {
        currency: generateCurrencyCode(this.#cti as number, 'Test NFT'),
        issuer: this.#issuingWallet?.classicAddress || '',
        value:
          '0.000000000000000000000000000000000000000000000000000000000000000000000000000000001',
      },
    };
    const res = await this.#xrplClient.submitAndWait(tx, {
      wallet: this.#distributorWallet,
    });
    console.log({ res });
  }

  async disconnectClient() {
    await this.#xrplClient.disconnect();
    console.log('Client disconnected');
  }
}

/* eslint-enable @typescript-eslint/no-unsafe-member-access */
/* eslint-enable @typescript-eslint/no-unsafe-argument */
