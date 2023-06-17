import './App.css';
import * as React from 'react';

//UI
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { deepPurple } from '@mui/material/colors';
import Snackbar from '@mui/material/Snackbar';
import Drawer from '@mui/material/Drawer';

//Components
import IpfsFiles from './components/ipfsFiles';
import SCApp from './components/StateContext';

const theme = createTheme({
    palette: {
        primary: {
            // Purple and green play nicely together.
            main: deepPurple[400],
        },
        secondary: {
            // This is green.A700 as hex.
            main: '#11cb5f',
        },
    },
});

const CONTEXT_IPFS = "ipfs";

class App extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            online : false,
            showMenu: false,
            message: null,
            context: CONTEXT_IPFS,
        }
    }

    render(){
        return (
            <div className="App">
            <ThemeProvider theme={theme}>
                <Box sx={{ flexGrow: 1 }}>
                <AppBar
                ref={this.menuButtonRef}
                position="static">
                <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                </Typography>
                <Drawer
                anchor="left"
                open={ this.state.showMenu }
                onClose={ e => this.setState({ showMenu : false })}
                >

                </Drawer>

                </Toolbar>
                </AppBar>
                    <IpfsFiles />
                </Box>
                <Snackbar
                open={ this.state.message != null }
                autoHideDuration={6000}
                onClose={ e => this.setState({ message : null}) }
                message={ this.state.message }
                />
                <SCApp/>
            </ThemeProvider>
            </div>
        );
    }
}

export default App;
