const { NftMinter } = require('./lib/src/index');
const { GravatarClient } = require('grav.client');

const client = new GravatarClient(
  'nascentblockchain@gmail.com',
  'testPassword'
);

//their gravatar 3bcdaedf7c7876d1a86f4cdf06005dbd
//upper case theirs 3BCDAEDF7C7876D1A86F4CDF06005DBD
//nascent hash a84bba0852464b744f7c656264e8e96d
//upper case ours A84BBA0852464B744F7C656264E8E96D

client.test().then(data => {
  console.log(client.emailHash);
});

const main = async () => {
  const minter = new NftMinter({
    gravatar: 'A84BBA0852464B744F7C656264E8E96D',
    domainName:
      '686173683A516D53634143684558654C4C716153546A644B4C4B69796D7634536442314E35714D51346551385A52327171486D',
    metadata: '3',
    hotWalletAddress: '1',
    hotWalletSecret: '1',
  });
  await minter.connectClient();
  await minter.createAccount();
  await minter.createDistributorAccount();
  await minter.accountSet();
  await minter.disconnectClient();
};

main();
