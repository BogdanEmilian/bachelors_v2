import React, {createContext, useContext, useEffect, useState} from "react";
import {ethers} from "ethers";
import abi from "./StorageMarket.json";
import erc20Abi from "./CloudStorageCoin.json";
import Web3 from 'web3';

const CONTRACT_ADDRESS = "0x85d3D00c1a3fABb6Dca9550713c8A46dA7EAda24";
const TOKEN_ADDRESS = "0x6A1e1f5d6862fbB714cf865d99552FEB1474e983";
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
            await contract.methods.registerStorageProvider(providerAddresses, storageCapacity, rewardDaily).send({from: address});
        } catch (error) {
            console.error(error);
        }
    };

    const requestPayment = async (amount) => {
        try {
            await contract.methods.requestPayment(amount).send({from: address});
        } catch (error) {
            console.error(error);
        }
    };

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
            }}
        >
            {children}
        </StateContext.Provider>
    );
};

export const useStateContext = () => useContext(StateContext);
