import React, { useState, useEffect } from 'react';
import { TextField, IconButton, Button, Typography, Box, Switch } from '@mui/material';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import { create } from 'ipfs-http-client';
import ipfsCluster from 'ipfs-cluster-api';
import NodeRSA from 'node-rsa';
import { useStateContext } from "./SmartContract";
import DownloadIcon from '@mui/icons-material/Download';
import "../index.css";
import { green } from "@mui/material/colors";

const theme = createTheme({
    palette: {
        primary: {
            main: green.A400,
        },
        secondary: {
            main: '#11cb5f',
        },
    },
    typography: {
        fontFamily: 'Orbitron, sans-serif',
    }
});

const StyledInputField = styled(TextField)({
    marginBottom: '16px',
});

const StyledButton = styled(Button)({
    marginTop: '16px',
});

const Android12Switch = styled(Switch)(({ theme }) => ({
    padding: 8,
    '& .MuiSwitch-track': {
        borderRadius: 22 / 2,
        '&:before, &:after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16,
            height: 16,
        },
        '&:before': {
            left: 12,
        },
        '&:after': {
            right: 12,
        },
    },
    '& .MuiSwitch-thumb': {
        boxShadow: 'none',
        width: 16,
        height: 16,
        margin: 2,
    },
    '&.MuiSwitch-colorSecondary.Mui-checked': {
        color: theme.palette.primary.main, // purple when enabled
    },
    '&.MuiSwitch-colorSecondary.Mui-checked + .MuiSwitch-track': {
        backgroundColor: theme.palette.primary.main, // purple when enabled
    },
    '&.MuiSwitch-colorSecondary.Mui-disabled': {
        color: theme.palette.secondary.main, // green when disabled
    },
    '&.MuiSwitch-colorSecondary.Mui-disabled + .MuiSwitch-track': {
        backgroundColor: theme.palette.secondary.main, // green when disabled
    },
}));

const cluster = ipfsCluster({
    host: '192.168.1.164',
    port: '9094',
    protocol: 'http'
});

const LabeledSwitch = ({ leftLabel, rightLabel, ...props }) => {
    return (
        <Box display="flex" alignItems="center">
            <Typography>{leftLabel}</Typography>
            <Android12Switch {...props} theme={theme} />
            <Typography>{rightLabel}</Typography>
        </Box>
    );
};

const key = new NodeRSA();

const IpfsFiles = (props) => {
    const {
        connect,
        registerUser,
        registerStorageProvider,
        requestPayment,
        hourlyPayment,
        deleteUser,
        deleteAllStorageProviders
    } = useStateContext();

    const [selectedFile, setSelectedFile] = useState(null);
    const [addPath, setAddPath] = useState('');
    const [addContent, setAddContent] = useState('');
    const [addRslt, setAddRslt] = useState(null);
    const [catPath, setCatPath] = useState('');
    const [catRslt, setCatRslt] = useState(null);
    const [history, setHistory] = useState([]);
    const [rsakey, setRsakey] = useState('');
    const [online, setOnline] = useState(false);
    const [node, setNode] = useState(null);
    const [userCostDaily, setUserCostDaily] = React.useState(0);
    const [providerAddresses, setProviderAddresses] = React.useState('');
    const [storageCapacity, setStorageCapacity] = React.useState(0);
    const [rewardDaily, setRewardDaily] = React.useState(0);
    const [paymentAmount, setPaymentAmount] = React.useState(0);
    const [hourlyPaymentAmount, setHourlyPaymentAmount] = React.useState(0);

    useEffect(() => {
        if (props.online !== online) {
            if (online) {
                start();
            } else {
                end();
            }
        }
    }, [props.online, online]);

    const onFileChange = event => {
        setSelectedFile(event.target.files[0]);
    };

    const fileData = () => {
        if (selectedFile) {
            return (
                <div>
                    The minimum daily price will be approximately: ~{selectedFile.size / 1e9 * 0.1 * 24} excluding gas prices
                </div>
            );
        }
    };

    const start = async () => {
        console.log("start()");

        try {
            const createdNode = await create({
                //TODO change the host to the storage provider
                host: 'localhost', port: '5001', protocol: 'http'
            });
            setNode(createdNode);
        } catch (e) {
            console.error(e);
        }
    };

    const end = async () => {
        if (node) {
            await node.stop();
            setNode(null);
        }
    };


    const check = () => {
        return node.isOnline();
    };

    const onFileUpload = async () => {
        if (!selectedFile) return;

        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(selectedFile);
        fileReader.onload = async (e) => {
            // Convert ArrayBuffer to Buffer
            const buffer = Buffer.from(e.target.result);

            key.importKey(rsakey, 'private');

            // Encrypt file data
            const encryptedData = key.encryptPrivate(buffer, 'base64');

            const resultAdd = await node.add({ content: encryptedData });

            const result = await cluster.pin.add(resultAdd.cid.toString(), (err) => {
                err ? console.error(err) : console.log('pin added');
            });
            console.log(resultAdd.cid.toString());

            // Use setAddRslt function to update the state
            setAddRslt(resultAdd);
        };
    };


    const downloadFile = async (path) => {
        if (!check() && !path) return;

        let arr = [];
        let length = 0;
        for await (const chunk of node.cat(path)) {
            arr.push(chunk);
            length += chunk.length;
        }

        let out = new Uint8Array(length);
        let ptr = 0;
        arr.forEach(item => {
            out.set(item, ptr);
            ptr += item.length;
        });

        // Convert the Uint8Array to a string
        const encryptedData = new TextDecoder().decode(out);

        key.importKey(rsakey, 'public');

        // Decrypt file data
        const decryptedData = key.decryptPublic(Buffer.from(encryptedData, 'base64'));

        // Create a blob from the decrypted data
        const blob = new Blob([decryptedData], { type: "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);

        // Download the file
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', path + ".txt");
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    };
//toast logger
    const handleButtonClick = async () => {
        if (online) {
            await end();
            setOnline(false);
        } else {
            await start();
            setOnline(true);
        }
    };

    const handleUpload = () => {
        registerUser(selectedFile.size * 24);
        requestPayment(selectedFile.size * 24);
        onFileUpload();
    };

    const handleDownload = (catPath) => {
        downloadFile(catPath);
        deleteAllStorageProviders();
        deleteUser();
    };

    const [isProvider, setIsProvider] = useState(false);

    const commonStyles = {
        width: '300px',
        margin: '10px 0',
    };

    const UserComponents = () => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
            <div>{addRslt && addRslt.cid.toString()}</div>
            <StyledInputField
                className="textFields-gb"
                id="input-textfield"
                label="Encryption/Decryption key"
                onKeyUp={(e) => setRsakey(e.target.value)}
                onBlur={(e) => setRsakey(e.target.value)}
                onPaste={(e) => setRsakey(e.target.value)}
            />
            <StyledInputField
                className="textFields-gb"
                id="input-with-icon-textfield"
                label="CID to download"
                onKeyUp={(e) => setCatPath(e.target.value)}
                onBlur={(e) => setCatPath(e.target.value)}
                InputProps={{
                    endAdornment: (
                        <IconButton onClick={(e) => handleDownload(catPath)}>
                            <DownloadIcon />
                        </IconButton>
                    ),
                }}
            />

            <h3>Choose a file to upload on the blockchain</h3>
            {fileData()}
            <div>
                <input type="file" onChange={onFileChange} />
            </div>
            <StyledButton className="textFields-gb" id="uploadButton" variant="contained" onClick={handleUpload}>
                Upload
            </StyledButton>
            <div style={{ position: 'fixed', bottom: '16px', right: '16px' }}>
                <StyledButton className="textFields-gb" id="uploadButton" variant="contained" onClick={hourlyPayment}>
                    Hourly payment
                </StyledButton>
            </div>
        </div>
    );


    const ProviderComponents = () => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
            <TextField
                className="textFields-gb"
                style={commonStyles}
                id="input-with-icon-textfield"
                label="Provided storage"
                onKeyUp={(e) => setStorageCapacity(e.target.value)}
                onBlur={(e) => setStorageCapacity(e.target.value)}
            />
            <StyledButton className="textFields-gb" variant="contained" onClick={(e) => registerStorageProvider(storageCapacity)}>
                Register
            </StyledButton>
        </div>
    );


    return (
        <div
            className="App"
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                height: '100vh',
                background: 'linear-gradient(to right, violet, gray-blue)',
            }}
        >
            <ThemeProvider theme={theme}>
                <Box display="flex" flexDirection="column" alignItems="center" gridColumn="span 3">
                    <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" marginBottom={2}>
                        <Button className="textFields-gb" color="inherit" onClick={connect}>
                            MetaMask connect
                        </Button>
                        <LabeledSwitch
                            defaultChecked={isProvider}
                            onChange={(e) => setIsProvider(e.target.checked)}
                            leftLabel="User"
                            rightLabel="Storage Provider"
                        />
                        <Button className="textFields-gb" id="start-button" color="inherit" onClick={handleButtonClick}>
                            IPFS connect: {online ? 'Online' : 'Offline'}
                        </Button>
                    </Box>
                    {isProvider ? <ProviderComponents /> : <UserComponents />}
                </Box>
            </ThemeProvider>
        </div>
    );
};

export default IpfsFiles;
