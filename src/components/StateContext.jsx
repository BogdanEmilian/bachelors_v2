
import React from 'react';
import { useStateContext } from './SmartContract';

function SCApp() {
    const {
        connect,
        registerUser,
        registerStorageProvider,
        requestPayment,
        hourlyPayment,
    } = useStateContext();

    const [userCostDaily, setUserCostDaily] = React.useState(0);
    const [providerAddresses, setProviderAddresses] = React.useState('');
    const [storageCapacity, setStorageCapacity] = React.useState(0);
    const [rewardDaily, setRewardDaily] = React.useState(0);
    const [paymentAmount, setPaymentAmount] = React.useState(0);
    const [hourlyPaymentAmount, setHourlyPaymentAmount] = React.useState(0);


    return (
        <div>
            {/*<button onClick={connect}>Connect Wallet</button>*/}

            {/*<h2>Register User</h2>*/}
            {/*<input type="number" value={userCostDaily} onChange={e => setUserCostDaily(e.target.value)} placeholder="Cost Daily" />*/}
            {/*<button onClick={() => registerUser(userCostDaily)}>Register User</button>*/}

            {/*<h2>Register Storage Provider</h2>*/}
            {/*<input type="text" value={providerAddresses} onChange={e => setProviderAddresses(e.target.value)} placeholder="Provider Addresses (comma separated)" />*/}
            {/*<input type="number" value={storageCapacity} onChange={e => setStorageCapacity(e.target.value)} placeholder="Storage Capacity" />*/}
            {/*<input type="number" value={rewardDaily} onChange={e => setRewardDaily(e.target.value)} placeholder="Reward Daily" />*/}
            {/*<button onClick={() => registerStorageProvider(providerAddresses, storageCapacity, rewardDaily)}>Register Storage Provider</button>*/}

            {/*<h2>Request Payment</h2>*/}
            {/*<input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Payment Amount" />*/}
            {/*<button onClick={() => requestPayment(paymentAmount)}>Request Payment</button>*/}

            {/*<h2>Hourly Payment</h2>*/}
            {/*<input type="number" value={hourlyPaymentAmount} onChange={e => setHourlyPaymentAmount(e.target.value)} placeholder="Payment Amount" />*/}
            {/*<button onClick={() => hourlyPayment(hourlyPaymentAmount)}>Hourly Payment</button>*/}
        </div>
    );
}

export default SCApp;