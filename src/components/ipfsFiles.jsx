import * as React from 'react';
import { useState, useEffect } from 'react';
import SubdirectoryArrowLeftIcon from '@mui/icons-material/SubdirectoryArrowLeft';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import { create } from 'ipfs-http-client';
import * as ipfsCluster from 'ipfs-cluster-api';
import Button from "@mui/material/Button";
import "../index.css";
import NodeRSA from 'node-rsa';
import {createTheme, styled} from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {useStateContext} from "./SmartContract";

//TODO: atm, the 2 VMs have different key pairs for RSA (website for generating pairs is: https://travistidwell.com/jsencrypt/demo/)
//TODO: handle exception on decryption fail due to keys not matching
const key = new NodeRSA();
key.importKey(process.env.REACT_APP_PRIVATE_KEY, 'private');
key.importKey(process.env.REACT_APP_PUBLIC_KEY, 'public');

const cluster = ipfsCluster({
    host: '192.168.1.164',
    port: '9094',
    protocol: 'http'
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
const theme = createTheme({
    palette: {
        primary: {
            main: '#800080', // Purple
        },
        secondary: {
            main: '#008000', // Green
        }
    }
});
const LabeledSwitch = ({ leftLabel, rightLabel, ...props }) => {
    return (
        <Box display="flex" alignItems="center">
            <Typography>{leftLabel}</Typography>
            <Android12Switch {...props} theme={theme}/>
            <Typography>{rightLabel}</Typography>
        </Box>
    );
};

const IpfsFiles = (props) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [addRslt, setAddRslt] = useState(null);
    const [catPath, setCatPath] = useState('');
    const [online, setOnline] = useState(false);
    const [node, setNode] = useState(null);


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
                    <h4>File Details:</h4>
                    <p>File Name: {selectedFile.name}</p>
                    <p>File Size: {selectedFile.size}</p>
                </div>
            );
        } else {
            return (
                <div>
                    <br />
                    <h5>Choose before Pressing the Upload button</h5>
                </div>
            );
        }
    };

    const start = async () => {
        console.log("start()");
        console.log("Secret Key: ", process.env.REACT_APP_SECRET_KEY);

        try{
            const createdNode = await create({
                //TODO change the host to the storage provider
                host: 'localhost', port: '5001', protocol: 'http'
            });
            setNode(createdNode);
        } catch(e) {
            console.error(e);
        }
    }

    const end = async () => {
        console.log("end()");
        if(node) {
            await node.stop();
            setNode(null); // It's probably a good idea to set the node to null after stopping it
        }
    }


    const check = () => {
        return node.isOnline();
    }

    const addFile = async ( path, content ) => {
        if ( ! this.check() && ( !path && ! content ) ) return;
        let data = {};
        if ( path ) data["path"] = path;
        if ( content ) data["content"] = content;

        const resultAdd = await node.add( data )

        const result = await cluster.pin.add(resultAdd.cid.toString(), (err) => {
            err ? console.error(err) : console.log('pin added')
        })
        console.log(resultAdd.cid.toString())
        console.log(result.toString())
        this.setState( s => ({ addRslt: resultAdd, history: s.history.concat( resultAdd.cid.toString() ) } ) );
    }

    const catFile = async (path) => {
        if (!this.check() && !path) return;
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
        setCatRslt(out);  // save Uint8Array instead of string
    };

    const onFileUpload = async () => {
        if (!selectedFile) return;

        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(selectedFile);
        fileReader.onload = async (e) => {
            // Convert ArrayBuffer to Buffer
            const buffer = Buffer.from(e.target.result);

            // Encrypt file data
            const encryptedData = key.encryptPrivate(buffer, 'base64');

            const resultAdd = await node.add({ content: encryptedData })

            const result = await cluster.pin.add(resultAdd.cid.toString(), (err) => {
                err ? console.error(err) : console.log('pin added')
            })
            console.log(resultAdd.cid.toString())

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



    const stat = async( path ) => {
        if ( this.check() && ! path ) return;
        const stats = await node.files.stat( path )
        this.setState({ statRsp : `${ stats.type} ${ stats.size} bytes ` });
    }

    const read = async ( path ) => {
        if ( ! this.check() && ! path ) return;
        let arr = [];
        let length = 0;
        for await (const chunk of node.files.read( path ) ) {
            arr.push( chunk);
            length += chunk.length;
        }
        let out = new Uint8Array( length );
        let ptr = 0;
        arr.forEach(item => {
            out.set( item, ptr );
            ptr += item.length;
        });
        this.setState({ readRslt :  new TextDecoder().decode( out ) });
    }

    const write = async ( path, content ) => {
        if ( ! this.check() || !path || ! content ) return;
        await node.files.write( path, content, { parents:true, create:true } );
    }

    const ls = async( path ) => {
        if ( this.check() && ! path ) return;
        const arr = [];
        for await (const file of node.files.ls( path )) {
            arr.push( file );
            console.log( file );
        }
        this.setState({ lsFileRslt : arr });
    }


    const resolve = async ( path ) => {
        if ( this.check() && ! path ) return;
        const arr = [];
        for await (const name of node.name.resolve( path )) {
            arr.push( name );
            console.log( name )
        }
        this.setState({ resolveRslt : arr });

    }

    const handleButtonClick = async () => {
        if (online) {
            await end();
            setOnline(false);
        } else {
            await start();
            setOnline(true);
        }
    };

    return (
        <>
            <Box display="flex" justifyContent="flex-end" marginRight={2}>
                <LabeledSwitch
                    defaultChecked
                    leftLabel="User"
                    rightLabel="Storage Provider"
                />
            </Box>
            <Box>
            {/*    implement connect to metamask*/}
            </Box>
            <Box display="flex" justifyContent="flex-start" marginLeft={2}>
                <Button id="start-button" color="inherit" onClick={handleButtonClick}>
                    {online ? 'stop' : 'start'}
                </Button>
            </Box>



            <h1>IPFS FILES API</h1>
            <h2>ipfs.add()</h2>

            <TextField
                fullWidth
                id="input-with-icon-textfield"
                label="Path"
                onKeyUp={ e => setAddPath(e.target.value) }
                onBlur={ e => setAddPath(e.target.value) }
            /> <TextField
            fullWidth
            id="input-with-icon-textfield"
            label="Content"
            onKeyUp={ e => setAddContent(e.target.value) }
            onBlur={ e => setAddContent(e.target.value) }

            InputProps={{
                endAdornment: (
                    <IconButton onClick={ e => addFile( setAddPath , setAddContent ) } >
                        <SubdirectoryArrowLeftIcon />
                    </IconButton>
                ),
            }}
        />
            <div>
                { addRslt && addRslt.cid.toString() }
            </div>
            <h2> ipfs.cat() </h2>
            <TextField
                fullWidth
                id="input-with-icon-textfield"
                label="Path"
                onKeyUp={ e => setCatPath(e.target.value) }
                onBlur={ e => setCatPath(e.target.value) }
                InputProps={{
                    endAdornment: (
                        <IconButton onClick={ e => catFile( catPath ) } >
                            <SubdirectoryArrowLeftIcon />
                        </IconButton>
                    ),
                }}
            />

            {/* Add file upload UI */}
            <h1>
                Choose a file to upload on the blockchain
            </h1>
            <div>
                <input type="file" onChange={onFileChange} />
            </div>
            <div>
                <Button id="uploadButton" variant="contained" onClick={onFileUpload}>Upload</Button>
            </div>
            {fileData()}
            <div padding={20}>
                <IconButton onClick={async e => { await downloadFile(catPath); }} >
                    <SubdirectoryArrowLeftIcon />
                </IconButton>
            </div>
        </>
    );
}

export default IpfsFiles;