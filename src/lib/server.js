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

const app = express();
const PORT = process.env.PORT || 3000;

//Middlewares
app.use(cors());
app.use(bodyParser.json());

//Define API routes. Define new versions in different routes to achieve backwards compatibility in integrations.
app.use('/api/', notarization);

//Catch all other routes
app.all('*', (req, res) => {
  return res.sendStatus(404);
});

export const start = () => {
  app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
  });
};

export const stop = () => {
  app.close(PORT, () => {
    console.log('Server stopped');
  });
};
