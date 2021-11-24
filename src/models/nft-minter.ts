/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as xrpl from 'xrpl';
import dotenv from 'dotenv';
import { ctiEncode, determineBithompUri, generateCurrencyCode } from '../utils';

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

  #issuedCurrencyCode?: string;

  #thirdPartyWallet?: xrpl.Wallet;

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
    console.log(
      `Issuing wallet: ${determineBithompUri(
        this.#xrplClient.connection.getUrl()
      )}/${this.#issuingWallet.classicAddress}`
    );
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

  async getLedger(id: string | number) {
    const tx: xrpl.LedgerRequest = {
      id: id,
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
      console.log(
        'Certification payment sent from issuing wallet to distributor wallet'
      );
      const {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result: { ledger_hash, ledger_index },
      } = await this.getLedger(payment.id);
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
    this.#issuedCurrencyCode = generateCurrencyCode(
      this.#cti as number,
      'TestNFT'
    ).toString();
    const tx: xrpl.TrustSet = {
      TransactionType: 'TrustSet',
      Account: this.#distributorWallet?.classicAddress || '',
      Flags: 262144,
      LimitAmount: {
        currency: this.#issuedCurrencyCode,
        issuer: this.#issuingWallet?.classicAddress || '',
        value:
          '0.000000000000000000000000000000000000000000000000000000000000000000000000000000002',
      },
    };
    await this.#xrplClient.submitAndWait(tx, {
      wallet: this.#distributorWallet,
    });
    if (this.#issuingWallet && this.#distributorWallet) {
      console.log(
        `Trustline created from wallet ${
          this.#distributorWallet?.classicAddress
        } to ${this.#issuingWallet?.classicAddress}`
      );
    }
  }

  async sendNft() {
    if (
      this.#issuingWallet &&
      this.#distributorWallet &&
      this.#issuedCurrencyCode !== undefined
    ) {
      const tx: xrpl.Payment = {
        Account: this.#issuingWallet.classicAddress,
        Amount: {
          issuer: this.#issuingWallet.classicAddress,
          currency: this.#issuedCurrencyCode,
          value:
            '0.000000000000000000000000000000000000000000000000000000000000000000000000000000002',
        },
        Destination: this.#distributorWallet.classicAddress,
        TransactionType: 'Payment',
      };
      await this.#xrplClient.submitAndWait(tx, {
        wallet: this.#issuingWallet,
      });
      console.log('NFT/s sent to distributor wallet');
    }
  }

  async sendToThirdParty() {
    if (
      this.#distributorWallet &&
      this.#issuedCurrencyCode !== undefined &&
      this.#issuingWallet
    ) {
      const response = await this.#xrplClient.fundWallet();

      const trustlineTx: xrpl.TrustSet = {
        TransactionType: 'TrustSet',
        Account: response.wallet.classicAddress || '',
        Flags: 262144,
        LimitAmount: {
          currency: this.#issuedCurrencyCode,
          issuer: this.#issuingWallet?.classicAddress || '',
          value:
            '0.000000000000000000000000000000000000000000000000000000000000000000000000000000001',
        },
      };
      await this.#xrplClient.submitAndWait(trustlineTx, {
        wallet: response.wallet,
      });

      const tx: xrpl.Payment = {
        Account: this.#distributorWallet.classicAddress,
        Amount: {
          issuer: this.#issuingWallet.classicAddress,
          currency: this.#issuedCurrencyCode,
          value:
            '0.000000000000000000000000000000000000000000000000000000000000000000000000000000001',
        },
        Destination: response.wallet.classicAddress,
        TransactionType: 'Payment',
      };
      await this.#xrplClient.submitAndWait(tx, {
        wallet: this.#distributorWallet,
      });
      console.log('Nft sent to third party wallet.');
    }
  }

  async disconnectClient() {
    await this.#xrplClient.disconnect();
    console.log('Client disconnected');
  }
}

/* eslint-enable @typescript-eslint/no-unsafe-member-access */
/* eslint-enable @typescript-eslint/no-unsafe-argument */
