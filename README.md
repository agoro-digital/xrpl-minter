# XRPL-Minter

> Tool to mint NFTs on the XRP Ledger. Simplifying access to XRP Ledger fans for the creation of their own Xrp Ledger nfts.

npx @agoro-digital/mint-nft to run the cli tool. Created by Agoro Digital, the company behind the Kapcher app.

The tool can be run with the following flags:

help: -h',
version: -v,
logLevel: -l debug/info(default),

# What does it do?

The cli tool takes the following steps:

1. Retrieves IPFS meta data.
2. Connects to selected net.
3. Creates/Retrieves details of nft issuing wallet.
4. Creates/Retrieves details of distributor wallet.
5. Configures the issuing wallet (enables rippling, adds artwork to email field, adds metadata to domain field).
6. Conducts the certification payment from issuer to distributor with populated memo fields(description, author, primaryUri).
7. Creates trustline from distributor to issuer.
8. Sends NFT from issuer to distributor.
9. Sets the regular key on the issuing account.
10. Removes Master key and blackholes the issuing account.
11. Issues link to xrplnft.art with your nft (please note you will not receive a green validation tick as this is reserved for aesthetes.art domain wallets only).
12. Disconnects selected net.

# Test net:

Test net will auto generate your issuing wallet and distributor wallet (you can also add your own if you wish).

You will require IPFS metadata and a file for it to work fully. E.g This meta data and file are good examples of best current practices: https://gateway.pinata.cloud/ipfs/QmScAChEXeLLqaSTjdKLKiymv4SdB1N5qMQ4eQ8ZR2qqHm - meta data

and https://gateway.pinata.cloud/ipfs/QmYUpAqhvKQvdRn9HJhn36sAkCjzhoK7FnAEc3uY4TSRpH - file(image/video etc)

Optional values for the cli tool are:

A Gravatar hash (see https://gravatar.com for creating an account and getting a hash).

A validation domain to be added to the distributor wallet (this domain would be where you would store your xrp-ledger.toml to prove who had created the nft).

# Main net

### Beware if you are using main net, as part of this process the issuing wallet will be blackholed, please note you will be asked to confirm your understanding of this situation when using the cli tool. Agoro Digital accept no liability or responsibility for your actions when using this tool.

You will require a seed for both issuing and distirbutor address (29 character long alpha numeric secret key).

You will require IPFS metadata and a file for it to work fully. E.g This meta data and file are good examples of best current practices: https://gateway.pinata.cloud/ipfs/QmScAChEXeLLqaSTjdKLKiymv4SdB1N5qMQ4eQ8ZR2qqHm - meta data

and https://gateway.pinata.cloud/ipfs/QmYUpAqhvKQvdRn9HJhn36sAkCjzhoK7FnAEc3uY4TSRpH - file(image/video etc)

Optional values for the cli tool are:

A Gravatar hash (see https://gravatar.com for creating an account and getting a hash).

A validation domain to be added to the distributor wallet (this domain would be where you would store your xrp-ledger.toml to prove who had created the nft).

# Inspiration

Thansk to all for their work in the discussions here: https://github.com/XRPLF/XRPL-Standards

Thanks to Aesthetes for their guide and information which we found here:
https://github.com/Aesthetes/Aesthetes-NFTs
