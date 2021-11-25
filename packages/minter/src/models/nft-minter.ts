/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as xrpl from 'xrpl';
import log from 'loglevel';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { ctiEncode, determineBithompUri, generateCurrencyCode } from '../utils';

dotenv.config();

export interface MinterConfig {
  gravatar?: string;
  cid: string;
  metadata: string;
  issuingWallet: string;
  issuingWalletSecret: string;
  clientUri?: string;
  /**
   * Set the log level for more detailed log outputs. Defaults to 'info'
   */
  logLevel?: log.LogLevelDesc;
  server?: string;
}

export class NftMinter {
  #gravatar?: string;

  #cid: string;

  #metadata: string;

  #issuingWallet?: xrpl.Wallet;

  #distributorWallet?: xrpl.Wallet;

  #xrplClient: xrpl.Client;

  #cti?: number;

  #issuedCurrencyCode?: string;

  #thirdPartyWallet?: xrpl.Wallet;

  constructor({
    gravatar,
    cid,
    metadata,
    clientUri,
    logLevel = 'info',
  }: MinterConfig) {
    log.setDefaultLevel(logLevel);
    this.#gravatar = gravatar;
    this.#cid = cid;
    this.#metadata = metadata;
    this.#issuingWallet = undefined;
    this.#distributorWallet = undefined;
    this.#xrplClient = new xrpl.Client(
      process.env.XRPL_NET || clientUri || 'wss://s.altnet.rippletest.net/'
    );
  }

  async connectClient() {
    await this.#xrplClient.connect();
    log.info(
      chalk.greenBright(
        `\nClient connected to ${chalk.underline(
          this.#xrplClient.connection.getUrl()
        )}`
      )
    );
  }

  async createAccount() {
    log.debug(chalk.yellow('\nCreating issuing wallet...'));
    const response = await this.#xrplClient.fundWallet();
    this.#issuingWallet = response.wallet;
    log.debug(
      `${chalk.greenBright('Created issuing wallet ✨')}: ${chalk.underline(
        `${determineBithompUri(this.#xrplClient.connection.getUrl())}/${
          this.#issuingWallet.classicAddress
        }`
      )}`
    );
  }

  async createDistributorAccount() {
    log.debug(chalk.yellow('\nCreating distributor wallet...'));
    const response = await this.#xrplClient.fundWallet();
    this.#distributorWallet = response.wallet;

    log.debug(
      `${chalk.greenBright('Created distributor wallet ✨')}: ${chalk.underline(
        `${determineBithompUri(this.#xrplClient.connection.getUrl())}/${
          this.#distributorWallet.classicAddress
        }`
      )}`
    );
  }

  async accountSet() {
    if (this.#issuingWallet) {
      const tx: xrpl.AccountSet = {
        TransactionType: 'AccountSet',
        Account: this.#issuingWallet.classicAddress,
        Domain: xrpl.convertStringToHex(`hash:${this.#metadata}`),
        ...(this.#gravatar && { EmailHash: this.#gravatar }),
        Fee: '12',
        SetFlag: 8,
      };
      log.debug(chalk.yellow('\nConfiguring issuer account...'));
      const response = await this.#xrplClient.submitAndWait(tx, {
        wallet: this.#issuingWallet,
      });
      log.debug(
        `${chalk.greenBright(
          'Configuration successful ✨ tx:'
        )} ${chalk.underline(
          `${determineBithompUri(this.#xrplClient.connection.getUrl())}/${
            response.result.hash
          }}`
        )}`
      );
    }
  }

  async getLedger(id: string | number) {
    const tx: xrpl.LedgerRequest = {
      command: 'ledger',
      ledger_index: id as number,
      transactions: true,
      expand: true,
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
          this.#createMemo(`hash:${this.#cid}`, 'text/uri', 'PrimaryUri'),
        ],
      };
      log.debug(
        chalk.yellow(
          '\nSending certification payment from issuer to distributor...'
        )
      );
      const payment = await this.#xrplClient.submitAndWait(tx, {
        wallet: this.#issuingWallet,
      });
      log.debug(
        `${chalk.greenBright(
          'Certification payment successful ✨ tx:'
        )} ${chalk.underline(
          `${determineBithompUri(this.#xrplClient.connection.getUrl())}/${
            payment.result.hash
          }}`
        )}`
      );
      const {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result: { ledger_hash },
      } = await this.getLedger(payment.result.ledger_index as number);
      this.#cti = Number(
        ctiEncode(
          payment.result.hash,
          //@ts-expect-error - error
          payment.result.meta.TransactionIndex,
          ledger_hash,
          payment.result.ledger_index as number
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
          '0.000000000000000000000000000000000000000000000000000000000000000000000000000000001',
      },
    };
    log.debug(
      chalk.yellow(
        '\nCreating a trustline between the distributor and issuer wallets...'
      )
    );
    const res = await this.#xrplClient.submitAndWait(tx, {
      wallet: this.#distributorWallet,
    });
    if (this.#issuingWallet && this.#distributorWallet) {
      log.debug(
        `${chalk.greenBright(
          'Trustline creation successful ✨ tx:'
        )} ${chalk.underline(
          `${determineBithompUri(this.#xrplClient.connection.getUrl())}/${
            res.result.hash
          }}`
        )}`
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
            '0.000000000000000000000000000000000000000000000000000000000000000000000000000000001',
        },
        Destination: this.#distributorWallet.classicAddress,
        TransactionType: 'Payment',
      };
      log.debug(chalk.yellow('\nSending NFT/s to distributor wallet...'));
      const res = await this.#xrplClient.submitAndWait(tx, {
        wallet: this.#issuingWallet,
      });
      log.debug(
        `${chalk.greenBright(
          'Sucessfully sent NFT/S 🚀 tx:'
        )} ${chalk.underline(
          `${determineBithompUri(this.#xrplClient.connection.getUrl())}/${
            res.result.hash
          }}`
        )}`
      );
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
      log.debug(chalk.greenBright('\nNft sent to third party wallet.'));
    }
  }

  async regularKeySet() {
    const tx: xrpl.SetRegularKey = {
      TransactionType: 'SetRegularKey',
      Account: this.#issuingWallet?.classicAddress as string,
      RegularKey: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
    };
    log.debug(chalk.yellow('\nSetting regular key for issuing account...'));
    const res = await this.#xrplClient.submitAndWait(tx, {
      wallet: this.#issuingWallet,
    });
    log.debug(
      `${chalk.greenBright(
        'Sucessfully set regular key for issuing account ✨ tx:'
      )} ${chalk.underline(
        `${determineBithompUri(this.#xrplClient.connection.getUrl())}/${
          res.result.hash
        }}`
      )}`
    );
  }

  async blackholeIssuingAccount() {
    const tx: xrpl.AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.#issuingWallet?.classicAddress as string,
      SetFlag: 4,
    };
    log.debug(chalk.yellow('\nBlackholing issuer wallet...'));

    const res = await this.#xrplClient.submitAndWait(tx, {
      wallet: this.#issuingWallet,
    });
    log.debug(
      `${chalk.greenBright(
        'Master key removed and issuing account blackholed! 🛸'
      )} ${chalk.underline(
        `${determineBithompUri(this.#xrplClient.connection.getUrl())}/${
          res.result.hash
        }}`
      )}`
    );
  }

  async disconnectClient() {
    await this.#xrplClient.disconnect();
    log.info(chalk.greenBright('\nClient disconnected'));
  }
}

/* eslint-enable @typescript-eslint/no-unsafe-member-access */
/* eslint-enable @typescript-eslint/no-unsafe-argument */
