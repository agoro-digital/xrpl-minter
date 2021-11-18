const { NftMinter } = require('./lib/src/index');

const main = async () => {
  const minter = new NftMinter({
    gravatar: '3BCDAEDF7C7876D1A86F4CDF06005DBD',
    domainName:
      '686173683A516D53634143684558654C4C716153546A644B4C4B69796D7634536442314E35714D51346551385A52327171486D',
    metadata: '3',
    hotWalletAddress: '1',
    hotWalletSecret: '1',
  });
  await minter.connectClient();
  await minter.createAccount();
  await minter.accountSet();
  await minter.disconnectClient();
};

main();
