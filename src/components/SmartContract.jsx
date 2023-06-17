import React, {createContext, useContext, useEffect, useState} from "react";
import abi from "./../contracts/StorageMarketABI.json";
import erc20Abi from "./../contracts/CSC_ABI.json";
import Web3 from 'web3';

const CONTRACT_ADDRESS = "0x2980AF5A0a9959b47DdBddecD40C92dfD9cEdD8a";
const TOKEN_ADDRESS = "0x3629CE614196696154Ae18d9cc0f48CA7946EcCE";
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