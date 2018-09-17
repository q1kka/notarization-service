/*
* Main entry point for application
* Initializes both IPFS and the connection to eth-node with web3
*/

import express from 'express';

//Import middleware
import cors from 'cors';
import bodyParser from 'body-parser';

//Import routes
import notarization from '../routes/notarization';

// Initiate api server
const apiServer = express();
const apiPort = process.env.apiPort || 3000;

// Log with timestamp
const logToConsole = text => {
  console.log(`${new Date().toLocaleString()} - ${text}`);
};

//Middlewares
apiServer.use(cors());
apiServer.use(bodyParser.json());

//Define API routes. Define new versions in different routes to achieve backwards compatibility in integrations.
apiServer.use('/api/notarization', notarization);
//define route for files
apiServer.use('/files', express.static(`public`));

//Catch all other routes
apiServer.all('*', (req, res) => {
  return res.sendStatus(404);
});

export const start = () => {
  apiServer.listen(apiPort, () => {
    logToConsole('API Server started');
    logToConsole(`API Server listening on port: ${apiPort}`);
  });
};

export const stop = () => {
  apiServer.close(apiPort, () => {
    logToConsole('API Server stopped');
  });
};
