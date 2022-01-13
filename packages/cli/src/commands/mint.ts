import { mint as nftMint } from '@agoro-digital/xrpl-nft';
import inquirer from 'inquirer';
import { isValidSeed } from '../utils';

export const mint = async (faucet: string) => {
  const { walletSecret, tokenTaxon, URI } = await inquirer.prompt<{
    walletSecret: string;
    tokenTaxon: number;
    URI?: string;
    extraOptions: boolean;
    extraOptionsChoice?: string;
  }>([
    {
      type: 'input',
      name: 'walletSecret',
      message: 'What is the seed of the issuing wallet?',
      validate: isValidSeed,
    },
    {
      type: 'number',
      name: 'tokenTaxon',
      message: 'What is the token taxon?',
      default: 0,
      validate: input => {
        if (typeof input !== 'number' || Number.isNaN(input)) {
          return 'You need to provide a number';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'URI',
      message: 'What is the URI of the NFT MetaData?',
      default: undefined,
    },
    {
      type: 'confirm',
      name: 'extraOptions',
      message:
        'There are a number of options available when minting a new NFT that are not required. Would you like to view these?',
      default: false,
    },
    {
      type: 'list',
      name: 'extraOptionsChoice',
      message: 'Select an extra option to add.',
      when: ({ extraOptions }) => extraOptions,
      choices: [
        {
          name: 'Set a Flag',
          value: 'flags',
        },
        {
          name: 'Set an issuer',
          value: 'issuer',
        },
      ],
    },
  ]);

  await nftMint(faucet, {
    walletSecret,
    TokenTaxon: tokenTaxon,
    URI,
  });
};
