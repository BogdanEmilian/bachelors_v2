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
