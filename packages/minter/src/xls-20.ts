import * as xrpl from 'xrpl';
import { NFTokenMint } from 'xrpl';

async function mint(client: xrpl.Client, wallet: xrpl.Wallet) {
  const tx: NFTokenMint = {
    TransactionType: 'NFTokenMint',
    Account: wallet.classicAddress,
    URI: xrpl.convertStringToHex(
      'ipfs://QmScAChEXeLLqaSTjdKLKiymv4SdB1N5qMQ4eQ8ZR2qqHm'
    ),
    TokenTaxon: 1,
  };

  const res = await client.submitAndWait(tx, { wallet, autofill: true });
}

async function listNfts(client: xrpl.Client, wallet: xrpl.Wallet) {
  //@ts-expect-error - error
  const nfts = await client.request({
    method: 'account_nfts',
    account: wallet.classicAddress,
  });
  //@ts-expect-error - error
  console.log(nfts.result.account_nfts);
}

async function burn(client: xrpl.Client, wallet: xrpl.Wallet) {
  const transactionBlob: xrpl.NFTokenBurn = {
    TransactionType: 'NFTokenBurn',
    Account: wallet.classicAddress,
    TokenID: '00000000477A8F39A19CCCA7C72342D17220082BE714667BB72E91A200000008',
  };

  await client.submitAndWait(transactionBlob, { wallet, autofill: true });
}

async function createSellOffer(
  client: xrpl.Client,
  wallet: xrpl.Wallet,
  tokenId: string
) {
  const transactionBlob: xrpl.NFTSellOffersRequest = {
    command: 'nft_sell_offers',
    TransactionType: 'NFTokenCreateOffer',
    Account: wallet.classicAddress,
    tokenid: tokenId,
    Amount: '10',
    Flags: Number.parseInt('1'),
  };
  //@ts-expect-error - error
  await client.submitAndWait(transactionBlob, { wallet });
}
async function init() {
  const client = new xrpl.Client('wss://xls20-sandbox.rippletest.net:51233');
  await client.connect();
  console.log('Connected to client!');

  return client;
}

async function main() {
  const client = await init();
  const wallet = xrpl.Wallet.fromSeed('shePK2hC5qqWJhUiufsNhNmMqBSuD');
  await listNfts(client, wallet);

  await createSellOffer(
    client,
    wallet,
    '00000000477A8F39A19CCCA7C72342D17220082BE714667BFBE004A70000000B'
  );
  await client.disconnect();
}

main()
  .then(() => {
    return;
  })
  .catch(error => console.error(error));
