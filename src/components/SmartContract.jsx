import React, {createContext, useContext, useEffect, useState} from "react";
import abi from "../contracts/StorageMarket_ABI.json";
import erc20Abi from "./../contracts/CSC_ABI.json";
import Web3 from 'web3';

const CONTRACT_ADDRESS = "0xEED6B2798ef10AD8221936a068Da9D92Dc704FB5";  // Storage Market address
const TOKEN_ADDRESS = "0x22e6633e0979cD0627DfeCB9e434761d291703C4";     // CSC address
const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
    const [web3, setWeb3] = useState(null);
    const [address, setAccount] = useState(null);
    const [contract, setContract] = useState(null);

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

    const registerUser = async (costDaily) => {
        try {
            await contract.methods.registerUser(address, costDaily).send({from: address});
        } catch (error) {
            console.error(error);
        }
    };

    const registerStorageProvider = async (providerAddresses, storageCapacity, rewardDaily) => {
        try {
            console.log("Trimmed address: " + providerAddresses);
            console.log("\n Storage capacity: " + storageCapacity + "\n Reward daily: " + rewardDaily);
            console.log("From address: " + {from:address});

            await contract.methods.registerStorageProvider(providerAddresses, storageCapacity, rewardDaily).send({from: address});
        } catch (error) {
            console.error(error);
        }
    };

    const requestPayment = async (amount) => {
        try {
            await tokenContract.methods.approve(CONTRACT_ADDRESS, amount).send({from: address});
            await contract.methods.requestPayment(amount).send({from: address});
        } catch (error) {
            console.error(error);
        }
    };

    const [tokenContract, setTokenContract] = useState(null);

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

    const hourlyPayment = async (amount) => {
        try {
            // Approve the contract to spend tokens on behalf of the user
            await tokenContract.methods.approve(CONTRACT_ADDRESS, amount).send({from: address});
            // Call the hourlyPayment function on the contract
            await contract.methods.hourlyPayment().send({from: address});
        } catch (error) {
            console.log({from: address}.toString());
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
            }}
        >
            {children}
        </StateContext.Provider>
    );
};

export const useStateContext = () => useContext(StateContext);