import React, { useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { deepPurple } from '@mui/material/colors';
import Snackbar from '@mui/material/Snackbar';
import Drawer from '@mui/material/Drawer';

import IpfsFiles from './components/ipfsFiles';

const theme = createTheme({
    palette: {
        primary: {
            main: deepPurple[400],
        },
        secondary: {
            main: '#11cb5f',
        },
    },
});

const App = () => {
    const [showMenu, setShowMenu] = useState(false);
    const [message, setMessage] = useState(null);

    return (
        <div className="App">
            <ThemeProvider theme={theme}>
                <Drawer
                    anchor="left"
                    open={showMenu}
                    onClose={() => setShowMenu(false)}
                ></Drawer>

                <IpfsFiles />

                <Snackbar
                    open={message !== null}
                    autoHideDuration={6000}
                    onClose={() => setMessage(null)}
                    message={message}
                />
            </ThemeProvider>
        </div>
    );
};

export default App;
