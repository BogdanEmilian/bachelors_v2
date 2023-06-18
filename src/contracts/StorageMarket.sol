// SPDX-License-Identifier: None
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts@4.8.3/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts@4.8.3/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts@4.8.3/access/Ownable.sol";
import "contract-aa0c0eac20.sol";

contract StorageMarket {

    uint public lastPaymentHour;

    struct User {
        address userAddress;
        uint costDaily; // static cost/day
    }

    struct StorageProvider {
        uint totalCapacity;
    }

    CloudStorageCoin public token;
    mapping(address => User) public users;
    mapping(address => StorageProvider) public storageProviders;
    address[] public providerAddresses; // keep track of all storage providers

    constructor(CloudStorageCoin _token) {
        token = _token;
        lastPaymentHour = block.timestamp;
    }


    // register user and providers
    function registerUser(address userAddress, uint costDaily) public {
        users[msg.sender] = User(userAddress, 100000000000000000 * costDaily); // this represents the price of 0.1 tokens/GB of storage
    }

    function registerStorageProvider(address providerAddress, uint totalCapacity) public {
        storageProviders[providerAddress] = StorageProvider(totalCapacity);
        providerAddresses.push(providerAddress); // Add provider address to array
    }

    // distribute payment across providers
    function distributePayment() public {
        // require at least 1 storage provider in order to proceed with payments
        uint totalAddresses = providerAddresses.length;
        require(totalAddresses > 0, "No addresses to distribute payment to");

        // find the weight of storage per provider for a fair price
        uint totalStorage = 0;
        for(uint i = 0; i < totalAddresses; i++) {
            totalStorage += storageProviders[providerAddresses[i]].totalCapacity;
        }

        // get current token balance of the contract
        uint256 totalPayment = token.balanceOf(address(this));

        // distribute payment based on providers storage
        for(uint i = 0; i < totalAddresses; i++) {
            uint providerStorage = storageProviders[providerAddresses[i]].totalCapacity;
            uint paymentPerAddress = (providerStorage * totalPayment) / totalStorage;

            token.transfer(providerAddresses[i], paymentPerAddress);
        }
    }

    function requestPayment() public {
        // get daily cost to assure payment
        uint amount = users[msg.sender].costDaily;

        // check the user has approved enough tokens
        require(token.allowance(msg.sender, address(this)) >= amount, "Please approve enough tokens before making a payment.");

        // transfer the specified amount from the user to this contract as payment
        require(token.balanceOf(msg.sender) >= amount, "Insufficient balance.");
        token.transferFrom(msg.sender, address(this), amount);
    }

    // TODO: change back to 1 day
    function hourlyPayment() public {
        // require that at least an hour has passed since the last payment
        require(block.timestamp >= lastPaymentHour + 1 minutes, "At least a day must have passed since the last payment.");

        // provide balance to contract
        requestPayment();

        // distribute the payment
        distributePayment();

        // Update the lastPaymentHour to the current hour
        lastPaymentHour = block.timestamp;
    }

    // contract closing
    function deleteUser() public {
        delete users[msg.sender];
    }

    function deleteAllStorageProviders() public {
        for (uint i = 0; i < providerAddresses.length; i++) {
            delete storageProviders[providerAddresses[i]];
        }

        delete providerAddresses;
    }

}
