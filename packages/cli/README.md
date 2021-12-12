# Mint NFT CLI tool

[![CircleCI](https://circleci.com/gh/agoro-digital/xrpl-minter/tree/main.svg?style=svg)](https://circleci.com/gh/agoro-digital/xrpl-minter/tree/main)

> A Command line tool to mint NFTs on the XRP Ledger. Simplifying access to XRP Ledger fans for the creation of their own Xrp Ledger nfts.

## Running the tool

Run the following command to run the tool.

```bash
npx @agoro-digital/mint-nft
```

The tool can be run with the following flags:

```
--help: -h – show the available commands in the terminal.
--version: -v – Display the current version of the tool
--logLevel: -l – Set the level of logging output in the terminal. Defaults to info.
```

## What does it do?

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

## Requirements

You will require IPFS metadata and a file for the tool to work fully. E.g [This meta data](https://gateway.pinata.cloud/ipfs/QmScAChEXeLLqaSTjdKLKiymv4SdB1N5qMQ4eQ8ZR2qqHm) and [this file](https://gateway.pinata.cloud/ipfs/QmYUpAqhvKQvdRn9HJhn36sAkCjzhoK7FnAEc3uY4TSRpH) are good examples of best current practices.

Optional values for the cli tool are:

A Gravatar hash (see [The Gravatar website](https://gravatar.com) for creating an account and getting a hash).

A validation domain to be added to the distributor wallet (this domain would be where you would store your xrp-ledger.toml to prove who had created the nft).

## Test net:

Test net will auto generate your issuing wallet and distributor wallet (you can also add your own if you wish).

## Main net

**Beware if you are using main net, as part of this process the issuing wallet will be blackholed, please note you will be asked to confirm your understanding of this situation when using the cli tool. Agoro Digital accept no liability or responsibility for your actions when using this tool.**

You will require a seed for both issuing and distirbutor address (29 character long alpha numeric secret key).

## Inspiration

Thanks to all for their work in the [discussions](https://github.com/XRPLF/XRPL-Standards)

Thanks to Aesthetes for [their guide and information](https://github.com/Aesthetes/Aesthetes-NFTs).

## Authors

Created by Agoro Digital, the company behind the Kapcher app.

- [Mike Huggins](https://github.com/Mike-Huggins)
- [Luke Brobbin](https://github.com/lukebrobbs)
