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
}
