/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as xrpl from 'xrpl';
import log from 'loglevel';
import chalk from 'chalk';
import dotenv from 'dotenv';
import {
  ctiEncode,
  determineBithompUri,
  determineXrplArtUri,
  generateCurrencyCode,
} from '../utils';
import axios from 'axios';

dotenv.config();

interface MetadataProperties {
  author: string;
}
interface MetadataInfo {
  name: string;
  description: string;
  image: string;
  properties: MetadataProperties;
}

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

  #nftName: string;

  #thirdPartyWallet?: xrpl.Wallet;

  #metadataInfo: MetadataInfo;

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
    this.#nftName = 'TestNft';
    this.#xrplClient = new xrpl.Client(
      process.env.XRPL_NET || clientUri || 'wss://s.altnet.rippletest.net/'
    );
    this.#metadataInfo = {
      name: 'test',
      image: 'test',
      description: 'test',
      properties: { author: 'test' },
    };
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
      try {
        const response = await axios.get(
          'https://gateway.pinata.cloud/ipfs/QmScAChEXeLLqaSTjdKLKiymv4SdB1N5qMQ4eQ8ZR2qqHm'
        );

        this.#metadataInfo = response.data;
        if (this.#metadataInfo !== undefined) {
          console.log(this.#metadataInfo);
          const tx: xrpl.Payment = {
            Account: this.#issuingWallet.classicAddress,
            Amount: '10000',
            Destination: this.#distributorWallet.classicAddress,
            TransactionType: 'Payment',
            Memos: [
              this.#createMemo(
                this.#metadataInfo.description,
                'text/plain',
                'Description'
              ),
              this.#createMemo(
                this.#metadataInfo?.properties.author,
                'text/plain',
                'Author'
              ),
              this.#createMemo(
                `${this.#metadataInfo.image}`,
                'text/uri',
                'PrimaryUri'
              ),
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
      } catch (error) {
        console.log(error.response.body);
      }
    }
  }

  async createTrustLine() {
    if (this.#metadataInfo !== undefined) {
      this.#issuedCurrencyCode = generateCurrencyCode(
        this.#cti as number,
        this.#metadataInfo?.name
      ).toString();
      const tx: xrpl.TrustSet = {
        TransactionType: 'TrustSet',
        Account: this.#distributorWallet?.classicAddress || '',
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
    log.debug(
      `\n${chalk.greenBright('NFT minting complete:')} ${chalk.underline(
        determineXrplArtUri(
          this.#xrplClient.connection.getUrl(),
          this.#issuingWallet?.classicAddress as string,
          this.#metadataInfo?.name
        )
      )}`
    );
    await this.#xrplClient.disconnect();
    log.info(chalk.greenBright('\nClient disconnected'));
  }
}

/* eslint-enable @typescript-eslint/no-unsafe-member-access */
/* eslint-enable @typescript-eslint/no-unsafe-argument */
