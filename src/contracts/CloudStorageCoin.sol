// SPDX-License-Identifier: None
pragma solidity ^0.8.9;

import "@openzeppelin/contracts@4.8.3/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts@4.8.3/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts@4.8.3/access/Ownable.sol";

contract CloudStorageCoin is ERC20, ERC20Burnable, Ownable {
    constructor() ERC20("CloudStorageCoin", "CSC") {
        _mint(msg.sender, 8000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

contract StorageMarket {

    uint public lastPaymentHour;

    struct User {
        address userAddress;
        uint dateUploaded;
        uint costDaily; // file_size_in_GB*1=cost/day
    }

    struct StorageProvider {
        address[] providerAddresses;
        uint usedStorage;
        uint dateStarted;
        uint rewardDaily; // reward for total space occupied, rewarded daily
    }

    CloudStorageCoin public token;
    mapping(address => User) public users;
    mapping(address => StorageProvider) public storageProviders;

    constructor(CloudStorageCoin _token) {
        token = _token;
    }

    // register user and providers
    function registerUser() public {
        users[msg.sender] = User(msg.sender, block.timestamp, 0);
    }

    function registerStorageProvider(address[] memory providerAddresses) public {
        storageProviders[msg.sender] = StorageProvider(providerAddresses, 0, block.timestamp, 0);
    }


    // distribute payment across providers
    function distributePayment(address providerAddress) public {
        StorageProvider storage provider = storageProviders[providerAddress];

        // require at least 1 storage provider in order to proceed with payments
        uint totalAddresses = provider.providerAddresses.length;
        require(totalAddresses > 0, "No addresses to distribute payment to");

        uint paymentPerAddress = provider.rewardDaily / totalAddresses;
        uint remainder = provider.rewardDaily % totalAddresses;

        for(uint i = 0; i < totalAddresses; i++) {
            uint payment = paymentPerAddress;

            // if it is the last iteration, add the remainder to the payment
            if (i == totalAddresses - 1) {
                payment += remainder;
            }

            require(token.balanceOf(address(this)) >= payment, "Insufficient contract balance.");
            token.transfer(provider.providerAddresses[i], payment);
        }
    }


    function requestPayment(uint256 amount) public {
        // check the user has approved enough tokens
        require(token.allowance(msg.sender, address(this)) >= amount, "Please approve enough tokens before making a payment.");

        // transfer the specified amount from the user to this contract as payment
        require(token.balanceOf(msg.sender) >= amount, "Insufficient user balance.");
        token.transferFrom(msg.sender, address(this), amount);

        // update user's daily cost
        users[msg.sender].costDaily += amount * 24 hours;
    }



    function hourlyPayment(address providerAddress) public {
        // require that at least an hour has passed since the last payment
        require(block.timestamp >= lastPaymentHour + 1 hours, "At least an hour must have passed since the last payment.");

        // distribute the payment
        distributePayment(providerAddress);

        // Update the lastPaymentHour to the current hour
        lastPaymentHour = block.timestamp;
    }
}