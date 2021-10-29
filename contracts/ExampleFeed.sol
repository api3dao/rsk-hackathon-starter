//SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@api3/airnode-protocol/contracts/AirnodeClient.sol";

contract ExampleFeed is AirnodeClient {
    mapping(bytes32 => bool) public incomingFulfillments;
    mapping(bytes32 => int256) public fulfilledData;
    int256 public price;

    constructor (address airnodeAddress)
        public
        AirnodeClient(airnodeAddress)
    {}

    function getPrice() public view returns(int256) {
        return price;
    }

    function makeRequest(
        bytes32 providerId,
        bytes32 endpointId,
        uint256 requesterInd,
        address designatedWallet,
        bytes calldata parameters
        )
        external
    {
        bytes32 requestId = airnode.makeFullRequest(
            providerId,
            endpointId,
            requesterInd,
            designatedWallet,
            address(this),
            this.fulfill.selector,
            parameters
            );
        incomingFulfillments[requestId] = true;
    }
    function fulfill(
        bytes32 requestId,
        uint256 statusCode,
        int256 data
        )
        external
        onlyAirnode()
    {
        require(incomingFulfillments[requestId], "No such request made");
        delete incomingFulfillments[requestId];
        if (statusCode == 0)
        {
            fulfilledData[requestId] = data;
            price = data;
        }
    }
}
