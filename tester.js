const { NftMinter } = require('./lib/src/index');
const { convertStringToHex } = require('xrpl');

const main = async () => {
  const minter = new NftMinter({
    gravatar: 'A84BBA0852464B744F7C656264E8E96D',
    domainName: convertStringToHex(
      'hash:QmPpFTehdAjoFYh4r45oBnAXofo4fGHYMCoNaTdjQ6XzRc'
    ),
    metadata: '3',
    hotWalletAddress: '1',
    hotWalletSecret: '1',
  });
  await minter.connectClient();
  await minter.createAccount();
  await minter.createDistributorAccount();
  await minter.accountSet();
  await minter.sendCertification();
  await minter.createTrustLine();
  await minter.sendNft();
  await minter.sendToThirdParty();
  await minter.disconnectClient();
};

main();
