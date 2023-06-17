import * as React from 'react';
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

class IPFSFiles extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedFile: null,
            addPath: '',
            addContent: '',
            addRslt: null,
            catPath: '',
            catRslt: null,
            history: [],
            online: false
        }
    }

    onFileChange = event => {
        this.setState({ selectedFile: event.target.files[0] });
    };

    fileData = () => {
        if (this.state.selectedFile) {
            return (
                <div>
                    <h4>File Details:</h4>
                    <p>File Name: {this.state.selectedFile.name}</p>
                    <p>File Size: {this.state.selectedFile.size}</p>
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

    start = async () => {
        console.log("this.start()");
        console.log("Secret Key: ", process.env.REACT_APP_SECRET_KEY);

        try{
            this.node = await create({
                //TODO change the host to the storage provider
                host: 'localhost', port: '5001', protocol: 'http'
            });

        } catch(e) {
            console.error(e);
        }
    }

    end = async () => {
        console.log("this.end()");
        await this.node.stop();
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {

        if (prevProps.online !== this.props.online) {
            console.log("componentDidUpdate");
            if (this.props.online) {
                await this.start();
            }else {
                await this.end();
            }
        }
    }

    check = () => {
        return this.node.isOnline();
    }

    addFile = async ( path, content ) => {
        if ( ! this.check() && ( !path && ! content ) ) return;
        let data = {};
        if ( path ) data["path"] = path;
        if ( content ) data["content"] = content;

        const resultAdd = await this.node.add( data )

        const result = await cluster.pin.add(resultAdd.cid.toString(), (err) => {
            err ? console.error(err) : console.log('pin added')
        })
        console.log(resultAdd.cid.toString())
        console.log(result.toString())
        this.setState( s => ({ addRslt: resultAdd, history: s.history.concat( resultAdd.cid.toString() ) } ) );
    }

    catFile = async (path) => {
        if (!this.check() && !path) return;
        let arr = [];
        let length = 0;
        for await (const chunk of this.node.cat(path)) {
            arr.push(chunk);
            length += chunk.length;
        }
        let out = new Uint8Array(length);
        let ptr = 0;
        arr.forEach(item => {
            out.set(item, ptr);
            ptr += item.length;
        });
        this.setState({ catRslt: out });  // save Uint8Array instead of string
    };

    onFileUpload = async () => {
        if (!this.state.selectedFile) return;

        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(this.state.selectedFile);
        fileReader.onload = async (e) => {
            // Convert ArrayBuffer to Buffer
            const buffer = Buffer.from(e.target.result);

            // Encrypt file data
            const encryptedData = key.encryptPrivate(buffer, 'base64');

            const resultAdd = await this.node.add({ content: encryptedData })

            const result = await cluster.pin.add(resultAdd.cid.toString(), (err) => {
                err ? console.error(err) : console.log('pin added')
            })
            console.log(resultAdd.cid.toString())
            this.setState(s => ({ addRslt: resultAdd, history: s.history.concat(resultAdd.cid.toString()) }));
        };
    };

    downloadFile = async (path) => {
        if (!this.check() && !path) return;

        let arr = [];
        let length = 0;
        for await (const chunk of this.node.cat(path)) {
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
        link.setAttribute('download', this.state.catPath + ".txt"); // working with archives only for now
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    };



    stat = async( path ) => {
        if ( this.check() && ! path ) return;
        const stats = await this.node.files.stat( path )
        this.setState({ statRsp : `${ stats.type} ${ stats.size} bytes ` });
    }

    read = async ( path ) => {
        if ( ! this.check() && ! path ) return;
        let arr = [];
        let length = 0;
        for await (const chunk of this.node.files.read( path ) ) {
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

    write = async ( path, content ) => {
        if ( ! this.check() || !path || ! content ) return;
        await this.node.files.write( path, content, { parents:true, create:true } );
    }

    ls = async( path ) => {
        if ( this.check() && ! path ) return;
        const arr = [];
        for await (const file of this.node.files.ls( path )) {
            arr.push( file );
            console.log( file );
        }
        this.setState({ lsFileRslt : arr });
    }


    resolve = async ( path ) => {
        if ( this.check() && ! path ) return;
        const arr = [];
        for await (const name of this.node.name.resolve( path )) {
            arr.push( name );
            console.log( name )
        }
        this.setState({ resolveRslt : arr });

    }

    handleButtonClick = async () => {
        if (this.state.online) {
            await this.end();
            this.setState({ online: false });
        } else {
            await this.start();
            this.setState({ online: true });
        }
    };

    render() {
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
                    <Button id="start-button" color="inherit" onClick={this.handleButtonClick}>
                        {this.state.online ? 'stop' : 'start'}
                    </Button>
                </Box>



                <h1>IPFS FILES API</h1>
                <h2>ipfs.add()</h2>

                <TextField
                    fullWidth
                    id="input-with-icon-textfield"
                    label="Path"
                    onKeyUp={ e => this.setState({ addPath : e.target.value }) }
                    onBlur={ e => this.setState({ addPath : e.target.value }) }
                /> <TextField
                fullWidth
                id="input-with-icon-textfield"
                label="Content"
                onKeyUp={ e => this.setState({ addContent : e.target.value }) }
                onBlur={ e => this.setState({ addContent : e.target.value }) }

                InputProps={{
                    endAdornment: (
                        <IconButton onClick={ e => this.addFile( this.state.addPath , this.state.addContent ) } >
                            <SubdirectoryArrowLeftIcon />
                        </IconButton>
                    ),
                }}
            />
                <div>
                    { this.state.addRslt && this.state.addRslt.cid.toString() }
                </div>
                <h2> ipfs.cat() </h2>
                <TextField
                    fullWidth
                    id="input-with-icon-textfield"
                    label="Path"
                    onKeyUp={ e => this.setState({ catPath : e.target.value }) }
                    onBlur={ e => this.setState({ catPath : e.target.value }) }
                    InputProps={{
                        endAdornment: (
                            <IconButton onClick={ e => this.catFile( this.state.catPath ) } >
                                <SubdirectoryArrowLeftIcon />
                            </IconButton>
                        ),
                    }}
                />
                <div>
                    {/*{ this.state.catRslt }*/}
                </div>

                {/* Add file upload UI */}
                <h1>
                    Choose a file to upload on the blockchain
                </h1>
                <div>
                    <input type="file" onChange={this.onFileChange} />
                </div>
                <div>
                    <Button id="uploadButton" variant="contained" onClick={this.onFileUpload}>Upload</Button>
                </div>
                {this.fileData()}
                <div padding={20}>
                    <IconButton onClick={async e => { await this.downloadFile(this.state.catPath); }} >
                        <SubdirectoryArrowLeftIcon />
                    </IconButton>
                </div>
            </>
        );
    }
}

export default IPFSFiles;