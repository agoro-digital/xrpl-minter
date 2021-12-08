#! /usr/bin/env node
import meow from 'meow';
import chalk from 'chalk';
import chalkAnimation from 'chalk-animation';
import { CID } from 'multiformats/cid';
import inquirer from 'inquirer';
import { NftMinter } from '@agoro-digital/xrpl-minter';

type Network = 'testnet' | 'mainnet';

const help = `
  Usage:
    $ npx mint-nft [flags...]

  Flags:
    --help, -h          Show this help message
    --version, -v       Show the version of this script
`;

run()
  .then(() => {
    return process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

const checkSeed = (seed: string) => {
  if (seed.length === 29) {
    return true;
  }
  return 'Invalid seed length';
};

async function run() {
  meow(help, {
    flags: {
      help: { type: 'boolean', default: false, alias: 'h' },
      version: { type: 'boolean', default: false, alias: 'v' },
    },
  });

  const anim = chalkAnimation.neon(`\n  X R P L  \nM I N T E R`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  anim.stop();

  console.log(
    chalk.magentaBright(
      "\n🍵 Welcome to xrpl-nft-minter! Let's get minting a new NFT.\n"
    )
  );

  const ledgers = new Map<Network, string>();
  ledgers.set('testnet', 'wss://s.altnet.rippletest.net/');
  ledgers.set('mainnet', 'wss://xrplcluster.com/');

  const networkAnswers = await inquirer.prompt<{
    network: Network;
    dangerWalletAtRisk: boolean;
  }>([
    {
      type: 'list',
      name: 'network',
      message: 'Which network would you like to create the NFT on?',
      default: 'testnet',
      choices: [
        { name: 'Testnet', value: 'testnet' },
        { name: 'Mainnet', value: 'mainnet' },
      ],
    },
    {
      type: 'confirm',
      name: 'dangerWalletAtRisk',
      message:
        'You have selected the mainnet, as part of this minting process the issuing account will be blackholed (this means you will never be able to use it again to submit any transactions whatsoever, any XRP or other currencies you have in that wallet will be lost. Please accept if you understand, if not then do not proceed any further.',
      default: false,
      when: ({ network }) => network === 'mainnet',
    },
  ]);

  if (networkAnswers.dangerWalletAtRisk === false) {
    process.exit(1);
  }

  const answers = await inquirer.prompt<{
    dangerWalletAtRisk: boolean;
    addIssuerWallet: boolean;
    issuerSecret: string;
    addDistributorWallet: boolean;
    distributorSecret: string;
    meta: string;
    addGravatarHash: boolean;
    gravatarHash: string | undefined;
  }>([
    {
      type: 'confirm',
      name: 'addIssuerWallet',
      message:
        'Do you wish to add an issuer wallet? If no, one will be created automatically.',
      default: false,
      when: () => networkAnswers.network === 'testnet',
    },
    {
      type: 'input',
      name: 'issuerSecret',
      message: 'What is the seed of the issuing wallet?',
      default: undefined,
      when: ({ addIssuerWallet }) =>
        networkAnswers.network === 'mainnet' || addIssuerWallet,
      validate: checkSeed,
    },
    {
      type: 'confirm',
      name: 'addDistributorWallet',
      message:
        'Do you wish to add a distributor wallet? If no, one will be created automatically.',
      default: false,
      when: () => networkAnswers.network === 'testnet',
    },
    {
      type: 'input',
      name: 'distributorSecret',
      message: 'What is the seed of the distributor wallet?',
      default: undefined,
      when: ({ addDistributorWallet }) =>
        networkAnswers.network === 'mainnet' || addDistributorWallet,
      validate: checkSeed,
    },
    {
      type: 'input',
      name: 'meta',
      message: 'What is the CID of the NFT meta file in IPFS?',
      validate: (cid: string) => {
        try {
          CID.parse(cid);
          return true;
        } catch {
          return 'Invalid CID';
        }
      },
    },
    {
      type: 'confirm',
      name: 'addGravatarHash',
      message: 'Do you wish to add a gravatar hash?',
      default: false,
      when: () =>
        networkAnswers.network === 'testnet' ||
        networkAnswers.network === 'mainnet',
    },
    {
      type: 'input',
      name: 'gravatarHash',
      message: 'What is the gravatar hash?',
      default: undefined,
      when: ({ addGravatarHash }) => addGravatarHash,
    },
  ]);

  const minter = new NftMinter({
    issuerSecret: answers.issuerSecret,
    distributorSecret: answers.distributorSecret,
    gravatar: answers.gravatarHash,
    metadata: answers.meta,
    logLevel: 'debug',
    clientUri: ledgers.get(networkAnswers.network),
  });

  await minter.init();
  await minter.accountSet();
  await minter.sendCertification();
  await minter.createTrustLine();
  await minter.accountSetDistributor();
  await minter.sendNft();
  await minter.regularKeySet();
  await minter.blackholeIssuingAccount();
  await minter.disconnectClient();
}
