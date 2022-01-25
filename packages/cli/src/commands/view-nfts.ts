import { listNftsForAccount } from '@agoro-digital/xrpl-nft';
import inquirer from 'inquirer';

export const viewNfts = async (faucet: string) => {
  const { walletAddress } = await inquirer.prompt<{
    walletAddress: string;
  }>([
    {
      type: 'input',
      name: 'walletAddress',
      message: 'What is the address of the issuing wallet?',
    },
  ]);

  const nfts = await listNftsForAccount(faucet, walletAddress);
  console.log(nfts);
};
