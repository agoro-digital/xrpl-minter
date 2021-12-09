/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as xrpl from 'xrpl';
import log from 'loglevel';
import invariant from 'tiny-invariant';
import chalk from 'chalk';
import dotenv from 'dotenv';
import {
  ctiEncode,
  determineBithompUri,
  determineXrplArtUri,
  generateCurrencyCode,
  getIpfsMeta,
  isError,
} from '../utils';

dotenv.config();

export interface MetadataProperties {
  author: string;
}
export interface MetadataInfo {
  name: string;
  description: string;
  image: string;
  properties: MetadataProperties;
}

export interface MinterConfig {
  gravatar?: string;
  metadata: string;
  clientUri?: string;
  /**
   * Set the log level for more detailed log outputs. Defaults to 'info'
   */
  logLevel?: log.LogLevelDesc;
  issuerSecret: string;
  distributorSecret: string;
}

export class NftMinter {
  #gravatar?: string;

  #metadata: string;

  #issuingWallet?: xrpl.Wallet;

  #issuingSecret?: string;

  #distributorWallet?: xrpl.Wallet;

  #distributorSecret?: string;

  #xrplClient: xrpl.Client;

  #cti?: BigInt;

  #issuedCurrencyCode?: string;

  #metadataInfo?: MetadataInfo;

  constructor({
    gravatar,
    metadata,
    clientUri,
    logLevel = 'info',
    issuerSecret,
    distributorSecret,
  }: MinterConfig) {
    log.setDefaultLevel(logLevel);
    this.#gravatar = gravatar?.toUpperCase();
    this.#metadata = metadata;
    this.#issuingWallet = undefined;
    this.#distributorWallet = undefined;
    this.#xrplClient = new xrpl.Client(
      process.env.XRPL_NET || clientUri || 'wss://s.altnet.rippletest.net/',
      {
        maxFeeXRP: '0.00005',
      }
    );
    this.#issuingSecret = issuerSecret;
    this.#distributorSecret = distributorSecret;
  }

  async init() {
    try {
      const meta = await getIpfsMeta(this.#metadata);
      this.#metadataInfo = meta.data;
    } catch (error) {
      if (isError(error)) {
        throw new Error(
          `\nError getting meta data from IFPS: ${error.message}`
        );
      }
    }

    await this.#xrplClient.connect();
    log.info(
      chalk.greenBright(
        `\nClient connected to ${chalk.underline(
          this.#xrplClient.connection.getUrl()
        )}`
      )
    );

    if (this.#issuingSecret !== undefined) {
      this.#issuingWallet = xrpl.Wallet.fromSecret(this.#issuingSecret);
      log.info(
        chalk.greenBright(
          `\nFound issuing wallet...${this.#issuingWallet.classicAddress}`
        )
      );
    } else {
      await this.createAccount();
    }
    if (this.#distributorSecret !== undefined) {
      this.#distributorWallet = xrpl.Wallet.fromSecret(this.#distributorSecret);
      log.info(
        chalk.greenBright(
          `\nFound distributor wallet...${
            this.#distributorWallet.classicAddress
          }`
        )
      );
    } else {
      await this.createDistributorAccount();
    }
  }

  async createAccount() {
    log.debug(chalk.yellow('\nCreating issuing wallet...'));
    const response = await this.#xrplClient.fundWallet();
    this.#issuingWallet = response.wallet;
    log.info(
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

    log.info(
      `${chalk.greenBright('Created distributor wallet ✨')}: ${chalk.underline(
        `${determineBithompUri(this.#xrplClient.connection.getUrl())}/${
          this.#distributorWallet.classicAddress
        }`
      )}`
    );
  }

  async accountSet() {
    invariant(this.#issuingWallet);
    const tx: xrpl.AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.#issuingWallet.classicAddress,
      Domain: xrpl.convertStringToHex(`hash:${this.#metadata}`),
      ...(this.#gravatar && { EmailHash: this.#gravatar }),
      SetFlag: 8,
    };

    const preparedTx = await this.#xrplClient.autofill(tx);
    log.debug(chalk.yellow('\nConfiguring issuer account...'));
    const response = await this.#xrplClient.submitAndWait(preparedTx, {
      wallet: this.#issuingWallet,
    });
    log.info(
      `${chalk.greenBright(
        'Issuing account configured ✨ tx:'
      )} ${chalk.underline(
        `${determineBithompUri(this.#xrplClient.connection.getUrl())}/${
          response.result.hash
        }}`
      )}`
    );
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
    invariant(this.#issuingWallet);
    invariant(this.#distributorWallet);
    invariant(this.#metadataInfo);

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
          this.#metadataInfo.properties.author,
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

    const preparedTx = await this.#xrplClient.autofill(tx);
    const payment = await this.#xrplClient.submitAndWait(preparedTx, {
      wallet: this.#issuingWallet,
    });
    log.info(
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
    this.#cti = ctiEncode(
      payment.result.hash,
      //@ts-expect-error - error
      payment.result.meta.TransactionIndex,
      ledger_hash,
      payment.result.ledger_index as number
    );
  }

  async createTrustLine() {
    invariant(this.#metadataInfo);
    this.#issuedCurrencyCode = generateCurrencyCode(
      this.#cti as BigInt,
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
    const preparedTx = await this.#xrplClient.autofill(tx);
    const res = await this.#xrplClient.submitAndWait(preparedTx, {
      wallet: this.#distributorWallet,
    });
    invariant(this.#issuingWallet);
    invariant(this.#distributorWallet);
    log.info(
      `${chalk.greenBright(
        'Trustline creation successful ✨ tx:'
      )} ${chalk.underline(
        `${determineBithompUri(this.#xrplClient.connection.getUrl())}/${
          res.result.hash
        }}`
      )}`
    );
  }

  async accountSetDistributor() {
    invariant(this.#distributorWallet);

    const tx: xrpl.AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.#distributorWallet.classicAddress,
      Domain: xrpl.convertStringToHex(`kapcher-staging.herokuapp.com`),
    };
    log.debug(chalk.yellow('\nConfiguring distributor account...'));

    const preparedTx = await this.#xrplClient.autofill(tx);

    const response = await this.#xrplClient.submitAndWait(preparedTx, {
      wallet: this.#distributorWallet,
    });
    log.info(
      `${chalk.greenBright(
        'Distributor wallet configuration successful ✨ tx:'
      )} ${chalk.underline(
        `${determineBithompUri(this.#xrplClient.connection.getUrl())}/${
          response.result.hash
        }}`
      )}`
    );
  }

  async sendNft() {
    invariant(this.#issuingWallet);
    invariant(this.#distributorWallet);
    invariant(this.#issuedCurrencyCode);

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

    const preparedTx = await this.#xrplClient.autofill(tx);
    const res = await this.#xrplClient.submitAndWait(preparedTx, {
      wallet: this.#issuingWallet,
    });
    log.info(
      `${chalk.greenBright('Sucessfully sent NFT/S 🚀 tx:')} ${chalk.underline(
        `${determineBithompUri(this.#xrplClient.connection.getUrl())}/${
          res.result.hash
        }}`
      )}`
    );
  }

  async regularKeySet() {
    const tx: xrpl.SetRegularKey = {
      TransactionType: 'SetRegularKey',
      Account: this.#issuingWallet?.classicAddress as string,
      RegularKey: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
    };
    log.debug(chalk.yellow('\nSetting regular key for issuing account...'));

    const preparedTx = await this.#xrplClient.autofill(tx);
    const res = await this.#xrplClient.submitAndWait(preparedTx, {
      wallet: this.#issuingWallet,
    });
    log.info(
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
    log.info(
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
    log.info(
      `\n${chalk.greenBright('NFT minting complete:')} ${chalk.underline(
        determineXrplArtUri(
          this.#xrplClient.connection.getUrl(),
          this.#issuingWallet?.classicAddress as string,
          this.#metadataInfo?.name as string
        )
      )}`
    );
    await this.#xrplClient.disconnect();
    log.info(chalk.greenBright('\nClient disconnected'));
  }
}

/* eslint-enable @typescript-eslint/no-unsafe-member-access */
/* eslint-enable @typescript-eslint/no-unsafe-argument */
