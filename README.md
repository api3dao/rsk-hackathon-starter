# RSK Airnode starter (Note: Pre-Alpha Airnode is being used for the hackathon, not any of the newly released versions)

> A starter project for deploying an Airnode and making requests to it

For a general overview of Airnode and API3 please see our docs https://github.com/api3dao/api3-docs. 

If you would like to follow along with a video demo of this airnode-starter you can watch here https://www.youtube.com/watch?v=k231uuQV4To. 

This project is composed of two steps:
1. Deploy an Airnode on RSK
1. Make a request to the deployed Airnode in a contract

You can skip the first step and use one of our partners deployed airnodes on RSK (https://api3.org/results?tag=bankathon) by modifying src/parameters.js to reflect the new providerId and endpointId, as well as scripts/makeRequest.js with the new parameters for the api call (line 25). See an example of these modifications at scripts/obp-example-request.js

You can also call the CoinGecko example one we deployed on RSK testnet without making any code modifications.
You are recommended to read the contents of the scripts as you run them, and read the entire readme before starting.

For our easiest developer experience you can try calling our constantly updated bitcoin price feed by reading the state from getPrice() on the modified ExacmpleClient.sol contract called ExampleFeed.sol (deployed at 0x26EADbF82E93bab4344Cc3157487c49A4243990a on testnet).

## Setup

First, you need to create a wallet and fund it.

1. Clone this repo
2. Run the following to install the dependencies
```sh
npm install
```
3. Run the following to build the contracts
```sh
npm run build
```
4. Run the following to generate a wallet, whose mnemonic phrase will be displayed on the terminal and recorded in a `.env` file at the project root.
```sh
npm run generate-wallet
```
5. Install [Metamask](https://metamask.io/) to your web browser and connect to RSK through this link https://medium.com/sovryn/setting-up-metamask-for-sovryn-on-mainnet-cbf798ca0c9a (instructions are for mainnet, switch chainId to 31, and the RPC to the given URL above).
6. Import the mnemonic phrase to Metamask
8. You can get funds from the faucet located here https://faucet.rsk.co/. 

Then, you need to set a provider URL to connect to RSK.
This will be used both by the deployed Airnode and by you while interacting with contracts.
 Replace `https://ropsten.infura.io/v3/{YOUR_KEY}` in your `.env` file with 'https://testnet.sovryn.app/rpc', a public node run by Sovryn (trying to use the public rsk nodes won't work because those rpc nodes do not expose the eth_getLogs method).

Note that you can use any other provider or your own node.
If you will be deploying your own Airnode, the provider endpoint must be publicly accessible (i.e., `127.0.0.1:8545` will not work).

*(You only need cloud credentials if you will not be skipping Step 1.)*

Follow the [docs](https://api3dao.github.io/api3-docs/pre-alpha/guides/provider/deploying-airnode.html#creating-cloud-credentials) to create your cloud credentials.
Place them at `/config/.env`, similar to [`/config/example.env`](/config/example.env).
Do not confuse this `.env` file with the one in the project root that keeps your mnemonic phrase and provider URL.

**Following these instructions to deploy an Airnode on AWS is [free](https://aws.amazon.com/free/) at the time this is being written.**

## Step 1: Deploy an Airnode

Normally, you would need to do two things before you deploy an Airnode:
1. [Specify the API integration](https://api3dao.github.io/api3-docs/pre-alpha/guides/provider/api-integration.html)
1. [Configure your Airnode](https://api3dao.github.io/api3-docs/pre-alpha/guides/provider/configuring-airnode.html)

For this project, we specified a minimal integration to the popular and free [CoinGecko API](https://www.coingecko.com/en/api), and prepared the configuration files.
We only integrated a single API operation, `GET` for `/coins/{id}`, which you can see below.
The `localization`, `tickers`, `community_data`, `developer_data` and `sparkline` parameters are [fixed](https://api3dao.github.io/api3-docs/pre-alpha/guides/provider/api-integration.html#fixedoperationparameters) as `"false"`, while `market_data` is fixed as `"true"`.
The `id` parameter will be provided by the requester (e.g., `"ethereum"`) under the name `coinId`.
You can make test calls over the [CoinGecko API docs](https://www.coingecko.com/en/api) to see the response format.

<p align="center">
  <img src="https://user-images.githubusercontent.com/19530665/103151070-be14ea00-478b-11eb-9608-a967c4282d9f.png" width="1024" />
</p>

See [config.example.json](/config/config.example.json) for how this integration is achieved.
We fixed the [reserved parameters](https://api3dao.github.io/api3-docs/pre-alpha/guides/provider/api-integration.html#reservedparameters) to read the value from `market_data.current_price.usd`, cast it as an `int256` and multiply it by `1,000,000` before returning.
No security scheme (i.e., API key) is defined in `config.json` or [`security.json`](/config/security.json) because the CoinGecko API is publicly accessible.

### Customize your `config.json`

Run the following to insert the contents of `.env` to `config/config.example.json` and save it as `config/config.json`
```sh
npm run customize-config
```

### Deploy

Now your `/config` directory should have the required [config.json](https://docs.api3.org/airnode/pre-alpha/airnode/specifications/config-json.html), [security.json](https://docs.api3.org/airnode/pre-alpha/airnode/specifications/security-json.html) and [.env](https://api3dao.github.io/api3-docs/pre-alpha/guides/provider/deploying-airnode.html#creating-cloud-credentials) files.
Run the following to deploy your node:

```sh
cd config
# The deployer has to be run in the directory where the configuration files are
docker run -it --rm \
  --env-file .env \
  --env COMMAND=deploy-first-time \
  -v $(pwd):/airnode/out \
  api3/airnode-deployer:pre-alpha
```

This will output a receipt file with the extension `.receipt.json`.

### Fund your master wallet

Run the following to send your master wallet 0.1 RBTC for it to [create a provider record](https://docs.api3.org/airnode/pre-alpha/protocols/request-response/provider.html) for you on-chain.
```sh
npm run fund-master-wallet
```

Your deployed Airnode will use these funds to make the transaction that will create the provider record on the chain you are operating on, and send the leftover RBTC back to your address automatically.
**You will have to wait ~1 minute for this to happen, otherwise the next step will fail.**

### Make your endpoint publicly accessible

`config.json` defines an [endpoint](https://api3dao.github.io/api3-docs/pre-alpha/protocols/request-response/endpoint.html) named `coinMarketData`, whose [endpoint ID](https://api3dao.github.io/api3-docs/pre-alpha/protocols/request-response/endpoint.html#endpointid) is `0xf466b8feec41e9e50815e0c9dca4db1ff959637e564bb13fefa99e9f9f90453c`.
Endpoints are not publicly accessible by default, so you will have to make a transaction for this.
Run the following to set your endpoint's [authorizers](https://api3dao.github.io/api3-docs/pre-alpha/protocols/request-response/authorizer.html) to `[0x0000000000000000000000000000000000000000]`, which makes it [publicly accessible](https://api3dao.github.io/api3-docs/pre-alpha/guides/provider/setting-authorizers.html#allow-all):
```sh
npm run update-authorizers
```

## Step 2: Make a request

The scripts in this step will use the Airnode you have deployed if you have completed Step 1.
Otherwise, it will use the `providerId` of the Airnode that we have deployed given in [`parameters.js`](/src/parameters.js). If you are making a request to an already deployed airnode you will need a valid config.json file to know the contract addresses and rpc url.
Note that the `endpointId` will be the same either way because it is [derived from the OIS and endpoint name](https://api3dao.github.io/api3-docs/pre-alpha/protocols/request-response/endpoint.html#endpointid).

### Create a requester

Run the following to create an on-chain [requester](https://api3dao.github.io/api3-docs/pre-alpha/protocols/request-response/requester.html) record:
```sh
npm run create-requester
```

You can use this requester denoted with an index in other projects as well.
Note that `requesterIndex` is chain-specific, so you will have to create another requester record on other chains.

### Deploy the client contract

Run the following to deploy `ExampleClient.sol`:
```sh
npm run deploy-client
```

### Endorse the client

Run the following to [endorse](https://api3dao.github.io/api3-docs/pre-alpha/protocols/request-response/endorsement.html) your deployed [client](https://api3dao.github.io/api3-docs/pre-alpha/protocols/request-response/client.html) contract using the requester you have created:
```sh
npm run endorse-client
```

### Derive and fund the designated wallet

First run the following to derive the [designated wallet](https://api3dao.github.io/api3-docs/pre-alpha/protocols/request-response/designated-wallet.html) for the provider–requester pair:
```sh
npm run derive-designated-wallet-address
```
and then fund this designated wallet with 0.1 RBTC:
```sh
npm run fund-designated-wallet
```

The requests that the client contract will make will be funded by this 0.1 RBTC.
Note that you may have to run `fund-designated-wallet` again if you make too many requests and use up this 0.1 RBTC (very unlikely).

### Make a request

Run the following to make a request:
```
npm run make-request
```
which should be fulfilled by the Airnode and printed out on the terminal.
Note that now that the price is on-chain, you can use it in your contract to implement any arbitrary logic.

Try replacing the `coinId` value in [`make-request.js`](/scripts/make-request.js) from `"ethereum"` to `"bitcoin"` and make another request.
You can see the API docs to find out which coin IDs are supported.

## Conclusion

You deployed an Airnode, made a request to it and received the response at the contract.
If you want to learn more, see the following resources:

- [API3 whitepaper](https://github.com/api3dao/api3-whitepaper) will give you a broad overview of the project
- [Medium posts](https://api3dao.github.io/api3-docs/pages/medium.html) are a more digestible version of the whitepaper
- [API3 docs](https://api3dao.github.io/api3-docs/pre-alpha/) will provide you with the theory of how Airnode and its protocol works
- [@api3/airnode-admin](https://github.com/api3dao/airnode/tree/pre-alpha/packages/admin) lets you interact with the Airnode contract (to create a request, endorse a client, etc.) using a CLI tool
- [Airnode client examples](https://github.com/api3dao/airnode-client-examples) demonstrate different request patterns that the Airnode protocol supports (for example, we used a full request in this starter project)

## Taking down your Airnode

It is very unlikely for you to forget to take down your Airnode because it is designed to be *set-and-forget*.
When you are done with this project, go to `config/` as your working directory and use the command below where `$RECEIPT_FILENAME` is replaced with the name of your receipt file ending with `.receipt.json` (you can refer to our [Docker instructions](https://github.com/api3dao/airnode/blob/pre-alpha/Docker.md) for more information)

```sh
docker run -it --rm \
  --env-file .env \
  --env COMMAND=remove-with-receipt \
  --env RECEIPT_FILENAME=$RECEIPT_FILENAME \
  -v $(pwd):/airnode/out \
  api3/airnode-deployer:pre-alpha
```
