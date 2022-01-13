// /* eslint-disable unicorn/no-null */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// import * as xrpl from 'xrpl';
// import { NFTokenMint } from 'xrpl';

// async function mint(client: xrpl.Client, wallet: xrpl.Wallet) {
//   const tx: NFTokenMint = {
//     TransactionType: 'NFTokenMint',
//     Account: wallet.classicAddress,
//     URI: xrpl.convertStringToHex(
//       'ipfs://QmScAChEXeLLqaSTjdKLKiymv4SdB1N5qMQ4eQ8ZR2qqHm'
//     ),
//     TokenTaxon: 1,
//   };

//   const res = await client.submitAndWait(tx, { wallet, autofill: true });
// }

// async function listNfts(client: xrpl.Client, wallet: xrpl.Wallet) {
//   //@ts-expect-error - error
//   const nfts = await client.request({
//     method: 'account_nfts',
//     account: wallet.classicAddress,
//   });
//   //@ts-expect-error - error
//   console.log(nfts.result.account_nfts);
//   //@ts-expect-error - error
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-return
//   return nfts.result.account_nfts;
// }

// async function burn(client: xrpl.Client, wallet: xrpl.Wallet) {
//   const transactionBlob: xrpl.NFTokenBurn = {
//     TransactionType: 'NFTokenBurn',
//     Account: wallet.classicAddress,
//     TokenID: '00000000477A8F39A19CCCA7C72342D17220082BE714667BB72E91A200000008',
//   };

//   await client.submitAndWait(transactionBlob, { wallet, autofill: true });
// }

// async function createSellOffer(
//   client: xrpl.Client,
//   wallet: xrpl.Wallet,
//   tokenId: string
// ) {
//   const transactionBlob: xrpl.NFTokenCreateOffer = {
//     TransactionType: 'NFTokenCreateOffer',
//     Account: wallet.classicAddress,
//     TokenID: tokenId,
//     Amount: '10',
//     Flags: 1,
//   };

//   await client.submitAndWait(transactionBlob, { wallet });
// }

// async function listBuyAndSellOffersForToken(
//   client: xrpl.Client,
//   token: string
// ) {
//   let nftSellOffers;
//   try {
//     //@ts-expect-error - err
//     nftSellOffers = await client.request({
//       method: 'nft_sell_offers',
//       tokenid: token,
//     });
//   } catch {
//     console.log('No sell offers.');
//   }
//   console.log(JSON.stringify(nftSellOffers, null, 2));
//   console.log('***Buy Offers***');
//   let nftBuyOffers;
//   try {
//     //@ts-expect-error - err
//     nftBuyOffers = await client.request({
//       method: 'nft_buy_offers',
//       tokenid: token,
//     });
//   } catch {
//     console.log('No buy offers.');
//   }
//   console.log(JSON.stringify(nftBuyOffers, null, 2));
//   return { buyOffers: nftBuyOffers, sellOffers: nftSellOffers };
// }

// async function acceptSellOffer(
//   client: xrpl.Client,
//   wallet: xrpl.Wallet,
//   sellOffer: string
// ) {
//   const transactionBlob: xrpl.NFTokenAcceptOffer = {
//     TransactionType: 'NFTokenAcceptOffer',
//     Account: wallet.classicAddress,
//     SellOffer: sellOffer,
//   };
//   const tx = await client.submitAndWait(transactionBlob, { wallet });
// }
// async function init() {
//   const client = new xrpl.Client('wss://xls20-sandbox.rippletest.net:51233');
//   await client.connect();
//   console.log('Connected to client!');

//   return client;
// }

// async function main() {
//   const client = await init();
//   const seller = xrpl.Wallet.fromSeed('shePK2hC5qqWJhUiufsNhNmMqBSuD');
//   const buyer = xrpl.Wallet.fromSeed('snhtQTfGFVU6xr12F6eHhxJUpaaME');
//   const sellerNfts = await listNfts(client, seller);

//   await createSellOffer(client, seller, sellerNfts[0].TokenID);
//   const { sellOffers } = await listBuyAndSellOffersForToken(
//     client,
//     sellerNfts[0].TokenID
//   );
//   await acceptSellOffer(client, buyer, sellOffers?.result.offers[0].index);
//   await listNfts(client, buyer);
//   await client.disconnect();
// }

// main()
//   .then(() => {
//     return;
//   })
//   .catch(error => console.error(error));

// /* eslint-enable @typescript-eslint/no-unsafe-assignment */
// /* eslint-enable @typescript-eslint/no-unsafe-member-access */
// /* eslint-enable @typescript-eslint/no-unsafe-argument */
// /* eslint-enable unicorn/no-null */

import { mint, listNftsForAccount } from '../lib';

// mint('wss://xls20-sandbox.rippletest.net:51233', {
//   walletSecret: 'shePK2hC5qqWJhUiufsNhNmMqBSuD',
//   TokenTaxon: 0,
// })
//   .then(() => {
//     return;
//   })
//   .catch(error => {
//     console.error(error);
//   });

listNftsForAccount(
  'wss://xls20-sandbox.rippletest.net:51233',
  'rfWAoUgec5WCGSqZmeHqPsYmH7DEDwrS2v'
)
  .then(nfts => {
    console.log(nfts);
    return;
  })
  .catch(error => {
    console.error(error);
  });
