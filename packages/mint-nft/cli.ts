#! /usr/bin/env node
import meow from 'meow';
import chalk from 'chalk';
import chalkAnimation from 'chalk-animation';
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

async function run() {
  meow(help, {
    flags: {
      help: { type: 'boolean', default: false, alias: 'h' },
      version: { type: 'boolean', default: false, alias: 'v' },
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const anim = chalkAnimation.neon(`\n  X R P L  \nM I N T E R`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  anim.stop();

  console.log(
    chalk.magentaBright(
      "\n🍵 Welcome to xrpl-nft-minter! Let's get minting a new NFT.\n"
    )
  );

  const ledgers = new Map<Network, string>();
  ledgers.set('testnet', 'wss://s.altnet.rippletest.net/');
  ledgers.set('mainnet', 'wss://xrplcluster.com/');

  const answers = await inquirer.prompt<{
    network: Network;
    issuerWallet: string | undefined;
    distributorWallet: string | undefined;
    meta: string;
    addIssuerWallet: boolean;
    addDistributorWallet: boolean;
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
      name: 'addIssuerWallet',
      message:
        'Do you wish to add an issuer wallet? If no, one will be created automatically.',
      default: false,
      when: ({ network }) => network === 'testnet',
    },
    {
      type: 'input',
      name: 'issuerWallet',
      message: 'What is the address of the issuing wallet?',
      default: undefined,
      when: ({ addIssuerWallet, network }) =>
        network === 'mainnet' || addIssuerWallet,
    },
    {
      type: 'confirm',
      name: 'addDistributorWallet',
      message:
        'Do you wish to add a distributor wallet? If no, one will be created automatically.',
      default: false,
      when: ({ network }) => network === 'testnet',
    },
    {
      type: 'input',
      name: 'distributorWallet',
      message:
        'What is the address of the distributor wallet? If on the testnet, this is not required.',
      default: undefined,
      when: ({ addDistributorWallet, network }) =>
        network === 'mainnet' || addDistributorWallet,
    },
    {
      type: 'input',
      name: 'meta',
      message: 'What is the CID of the NFT meta file in IPFS?',
    },
  ]);

  //@ts-expect-error - not added issuing wallet info yet
  const minter = new NftMinter({
    metadata: answers.meta,
    logLevel: 'debug',
    clientUri: ledgers.get(answers.network),
  });

  await minter.init();
  await minter.createAccount();
  await minter.createDistributorAccount();
  await minter.accountSet();
  await minter.sendCertification();
  await minter.createTrustLine();
  await minter.sendNft();
  await minter.sendToThirdParty();
  await minter.regularKeySet();
  await minter.blackholeIssuingAccount();
  await minter.disconnectClient();
}
