import { mint as nftMint, MintConfig } from '@agoro-digital/xrpl-nft';
import inquirer from 'inquirer';
import { isValidSeed } from '../utils';

const addIssuer: inquirer.QuestionCollection<{ answer: string | number }> = {
  type: 'input',
  name: 'answer',
  message: 'Set the issuer',
};

const askForExtras = async () => {
  let extras: {
    [K: string]: string | number;
  } = {};
  const { extraOptionsChoice } = await inquirer.prompt<{
    extraOptionsChoice: string;
  }>([
    {
      type: 'list',
      name: 'extraOptionsChoice',
      message: 'Select an extra option to add.',
      choices: [
        {
          name: 'Set an issuer',
          value: 'Issuer',
        },
      ],
    },
  ]);

  const optionsMap = new Map<
    string,
    inquirer.QuestionCollection<{ answer: string | number }>
  >();
  optionsMap.set('Issuer', addIssuer);

  const question = optionsMap.get(extraOptionsChoice);

  if (question) {
    const { answer } = await inquirer.prompt(question);
    extras[extraOptionsChoice] = answer;
  }

  const { askAgain } = await inquirer.prompt<{ askAgain: boolean }>([
    {
      type: 'confirm',
      name: 'askAgain',
      message: 'Would you like to add another parameter?',
      default: false,
    },
  ]);

  if (askAgain) {
    const additionaLExtras = await askForExtras();
    extras = {
      ...extras,
      ...additionaLExtras,
    };
  }
  return extras;
};

export const mint = async (faucet: string) => {
  const { walletSecret, tokenTaxon, URI, extraOptions } =
    await inquirer.prompt<{
      walletSecret: string;
      tokenTaxon: number;
      URI?: string;
      extraOptions: boolean;
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
    ]);
  let extras: Partial<MintConfig> = {};
  if (extraOptions) {
    extras = await askForExtras();
  }

  await nftMint(faucet, {
    walletSecret,
    TokenTaxon: tokenTaxon,
    URI,
    ...extras,
  });
};
