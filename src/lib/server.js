/*
* Main entry point for application
* Initializes both IPFS and the connection to eth-node with web3
*/

const PORT = 5000;

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
