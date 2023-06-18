import React, {createContext, useContext, useEffect, useState} from "react";
import abi from "../contracts/StorageMarket_ABI.json";
import erc20Abi from "./../contracts/CSC_ABI.json";
import Web3 from 'web3';

const CONTRACT_ADDRESS = "0xfF1Bdd9731744ce5932117226746C9d7098E2c1C";  // Storage Market address
const TOKEN_ADDRESS = "0x7522AC61e8CcC77d05863FF69F393DDc7CFAf5C3";     // CSC address
const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
    const [web3, setWeb3] = useState(null);
    const [address, setAccount] = useState(null);
    const [contract, setContract] = useState(null);                 // Storage Market
    const [tokenContract, setTokenContract] = useState(null);       // CSC

    const connect = async () => {
        if (window.ethereum) {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const web3Instance = new Web3(window.ethereum);
                const accounts = await web3Instance.eth.getAccounts();
                setWeb3(web3Instance);
                setAccount(accounts[0]);
                console.log(accounts[0]);
            } catch (err) {
                console.error(err);
            }
        }
    };

    useEffect(() => {
        const initializeContract = async () => {
            if (web3 && address) {
                try {
                    const contractInstance = new web3.eth.Contract(
                        abi,
                        CONTRACT_ADDRESS,
                    );
                    setContract(contractInstance);
                } catch (err) {
                    console.error(err);
                }
            }
        };

        initializeContract();
    }, [web3, address]);

    // register user
    const registerUser = async (costDaily) => {
        try {
            // Please note that costDaily needs to be in the same unit that the contract expects (i.e. wei).
            await contract.methods.registerUser(address, costDaily).send({from: address});
        } catch (error) {
            console.error(error);
        }
    };

    // register storage provider
    const registerStorageProvider = async (totalCapacity) => {
        try {
            // Please note that totalCapacity needs to be in the same unit that the contract expects.
            await contract.methods.registerStorageProvider(address, totalCapacity).send({from: address});
        } catch (error) {
            console.error(error);
        }
    };

    // remove user
    const deleteUser = async () => {
        try {
            // Please note that costDaily needs to be in the same unit that the contract expects (i.e. wei).
            await contract.methods.deleteUser().send({from: address});
        } catch (error) {
            console.error(error);
        }
    };

    // remove storage providers
    const deleteAllStorageProviders = async () => {
        try {
            // Please note that costDaily needs to be in the same unit that the contract expects (i.e. wei).
            await contract.methods.deleteAllStorageProviders().send({from: address});
        } catch (error) {
            console.error(error);
        }
    };

    // request payment
    const requestPayment = async () => {
        try {
            await tokenContract.approve(contractAddress, amount);
            await contract.methods.requestPayment().send({from: address});
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const initializeTokenContract = async () => {
            if (web3 && address) {
                try {
                    const tokenContractInstance = new web3.eth.Contract(
                        erc20Abi,
                        TOKEN_ADDRESS,
                    );
                    setTokenContract(tokenContractInstance);
                } catch (err) {
                    console.error(err);
                }
            }
        };

        initializeTokenContract();
    }, [web3, address]);

    // hourly payment
    const hourlyPayment = async () => {
        try {
            await contract.methods.hourlyPayment().send({from: address});
        } catch (error) {
            console.error(error);
        }
    };


    return (
        <StateContext.Provider
            value={{
                address,
                connect,
                contract,
                registerUser,
                registerStorageProvider,
                requestPayment,
                hourlyPayment,
                deleteUser,
                deleteAllStorageProviders
            }}
        >
            {children}
        </StateContext.Provider>
    );
};

export const useStateContext = () => useContext(StateContext);
