require('dotenv').config();
const ethers = require('ethers');
const airnodeAbi = require('@api3/airnode-abi');
const evm = require('../src/evm');
const util = require('../src/util');
const parameters = require('../src/parameters');

async function main() {
  const path = 'banks.0.id';
  const type = 'bytes32';
  const providerId = '0xc6323485739cdf4f1073c1b21bb21a8a5c0a619ffb84dd56c4f4454af2802a40';
  const endpointId = '0xbfd499b3bebd55fe02ddcdd5a2f1ab36ef75fb3ace1de05c878d0b53ce4a7296';
  const wallet = await evm.getWallet();
  const exampleClient = new ethers.Contract(
    util.readFromLogJson('ExampleClient address'),
    evm.ExampleClientArtifact.abi,
    wallet
  );
  const airnode = await evm.getAirnode();

  console.log('Making the request...');
  async function makeRequest() {
    const receipt = await exampleClient.makeRequest(
      providerId,
      endpointId,
      util.readFromLogJson('Requester index'),
      util.readFromLogJson('Designated wallet address'),
      airnodeAbi.encode([{ name: '_path', type: 'bytes32', value: path},
              { name: '_type', type: 'bytes32', value: type},])
    );
    return new Promise((resolve) =>
      wallet.provider.once(receipt.hash, (tx) => {
        const parsedLog = airnode.interface.parseLog(tx.logs[0]);
        resolve(parsedLog.args.requestId);
      })
    );
  }

  const requestId = await makeRequest();
  console.log(`Made the request with ID ${requestId}.\nWaiting for it to be fulfilled...`);
  function fulfilled(requestId) {
    return new Promise((resolve) =>
      wallet.provider.once(airnode.filters.ClientRequestFulfilled(null, requestId), resolve)
    );
  }
  await fulfilled(requestId);
  console.log('Request fulfilled');
  const data = await exampleClient.fulfilledData(requestId);
  console.log(`data returned is ${ethers.utils.parseBytes32String(data)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
