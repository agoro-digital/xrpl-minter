#! /usr/bin/env node
import meow from 'meow';
import chalk from 'chalk';
import chalkAnimation from 'chalk-animation';
import inquirer from 'inquirer';
import { mint, viewNfts } from './commands';
import type { Command, Faucet } from './types';
import { getFaucet } from './utils';
import invariant from 'tiny-invariant';

const help = `
  Usage:
    $ npx mint-nft [flags...]

  Flags:
    --help, -h          Show this help message
    --version, -v       Show the version of this script
    --logLevel, -l      Set the log level of the CLI tool
`;

run()
  .then(() => {
    return process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

// const isTestnet = (network: Network) => network === 'testnet';
// const isMainnet = (network: Network) => network === 'mainnet';

async function run() {
  meow(help, {
    flags: {
      help: { type: 'boolean', default: false, alias: 'h' },
      version: { type: 'boolean', default: false, alias: 'v' },
      logLevel: { type: 'string', default: 'info', alias: 'l' },
    },
  });

  const anim = chalkAnimation.neon(`\n  X R P L  N F T`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  anim.stop();

  console.log(chalk.magentaBright('\n🍵 Welcome to xrpl-nft cli tool!.\n'));

  const commands = new Map<Command, (faucet: string) => Promise<void>>();
  commands.set('mint', mint);
  commands.set('viewNfts', viewNfts);

  const { command, faucet } = await inquirer.prompt<{
    command: Command;
    faucet: Faucet;
  }>([
    {
      name: 'command',
      type: 'list',
      message: 'what would you like to do?',
      choices: [
        { name: 'Mint a new NFT', value: 'mint' },
        { name: 'View NFTS for an account', value: 'viewNfts' },
      ],
    },
    {
      name: 'faucet',
      type: 'list',
      message: 'Which XRP network do you wish to mint on?',
      choices: [
        { name: 'NFT-Devnet', value: 'nftDevnet' },
        { name: 'Testnet', value: 'testnet' },
        { name: 'Mainnet', value: 'mainnet' },
      ],
    },
  ]);

  const xrpNetwork = getFaucet(faucet);

  invariant(xrpNetwork, 'Unable to find matching XRP network');

  const commandToRun = commands.get(command);
  if (commandToRun) {
    await commandToRun(xrpNetwork);
  }

  // const util = await inquirer.prompt([
  //   {
  //     type: "list",
  //     message: "which command would you like to run?",
  //     choices:
  //   }
  // ])

  // const networkAnswers = await inquirer.prompt<{
  //   network: Network;
  //   dangerWalletAtRisk: boolean;
  // }>([
  //   {
  //     type: 'list',
  //     name: 'network',
  //     message: 'Which network would you like to create the NFT on?',
  //     default: 'testnet',
  //     choices: [
  //       { name: 'Testnet', value: 'testnet' },
  //       { name: 'Mainnet', value: 'mainnet' },
  //     ],
  //   },
  //   {
  //     type: 'confirm',
  //     name: 'dangerWalletAtRisk',
  //     message: chalk.yellow(
  //       'WARNING: As part of this minting process the issuing account will be blackholed (this means you will never be able to use it again to submit any transactions whatsoever, any XRP or other currencies you have in that wallet will be lost). Please accept if you understand, if not then do not proceed any further.'
  //     ),
  //     default: false,
  //     when: ({ network }) => isMainnet(network),
  //   },
  // ]);

  // if (!networkAnswers.dangerWalletAtRisk && isMainnet(networkAnswers.network)) {
  //   process.exit(0);
  // }

  // const answers = await inquirer.prompt<{
  //   addIssuerWallet: boolean;
  //   issuerSecret: string;
  //   addDistributorWallet: boolean;
  //   distributorSecret: string;
  //   meta: string;
  //   addGravatarHash: boolean;
  //   addDistributorDomain: boolean;
  //   gravatarHash?: string;
  //   distributorDomain?: string;
  // }>([
  //   {
  //     type: 'confirm',
  //     name: 'addIssuerWallet',
  //     message:
  //       'Do you wish to add an issuer wallet? If no, one will be created automatically.',
  //     default: false,
  //     when: () => isTestnet(networkAnswers.network),
  //   },
  //   {
  //     type: 'input',
  //     name: 'issuerSecret',
  //     message: 'What is the seed of the issuing wallet?',
  //     default: undefined,
  //     when: ({ addIssuerWallet }) =>
  //       isMainnet(networkAnswers.network) || addIssuerWallet,
  //     validate: isValidSeed,
  //   },
  //   {
  //     type: 'confirm',
  //     name: 'addDistributorWallet',
  //     message:
  //       'Do you wish to add a distributor wallet? If no, one will be created automatically.',
  //     default: false,
  //     when: () => isTestnet(networkAnswers.network),
  //   },
  //   {
  //     type: 'input',
  //     name: 'distributorSecret',
  //     message: 'What is the seed of the distributor wallet?',
  //     default: undefined,
  //     when: ({ addDistributorWallet }) =>
  //       isMainnet(networkAnswers.network) || addDistributorWallet,
  //     validate: isValidSeed,
  //   },
  //   {
  //     type: 'input',
  //     name: 'meta',
  //     message: 'What is the CID of the NFT meta file in IPFS?',
  //     validate: (cid: string) => {
  //       try {
  //         CID.parse(cid);
  //         return true;
  //       } catch {
  //         return 'Invalid CID';
  //       }
  //     },
  //   },
  //   {
  //     type: 'confirm',
  //     name: 'addGravatarHash',
  //     message: 'Do you wish to add a gravatar hash?',
  //     default: false,
  //   },
  //   {
  //     type: 'input',
  //     name: 'gravatarHash',
  //     message: 'Enter the gravatar hash',
  //     default: undefined,
  //     when: ({ addGravatarHash }) => addGravatarHash,
  //   },
  //   {
  //     type: 'confirm',
  //     name: 'addDistributorDomain',
  //     message: 'Do you wish to add a distributor domain for validation?',
  //     default: false,
  //   },
  //   {
  //     type: 'input',
  //     name: 'distributorDomain',
  //     message: 'Enter the distributor domain',
  //     default: undefined,
  //     when: ({ addDistributorDomain }) => addDistributorDomain,
  //   },
  // ]);

  // const minter = new NftMinter({
  //   issuerSecret: answers.issuerSecret,
  //   distributorSecret: answers.distributorSecret,
  //   distributorDomain: answers.distributorDomain,
  //   gravatar: answers.gravatarHash,
  //   metadata: answers.meta,
  //   logLevel: cli.flags.logLevel as LogLevelDesc,
  //   clientUri: faucets.get(networkAnswers.network),
  // });

  // await minter.mint();
}
