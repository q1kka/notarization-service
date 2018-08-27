# notarization-component

Notarization component interacts with smart contracts and IPFS
##Smart contract
Follow this procedure to migrate smart contracts for development environment

1. Go to smart_contract folder
   `cd smart_contract/`
2. Start truffle - This step launches local Ethereum instance
   `truffle develop`
3. In the truffle console, compile the smart contract (creates a build/ folder)
   `compile`
4. In the truffle console, migrate the smart contract to the current instance
   `migrate`

Now you have started a local Ethereum blockchain instance, and other applications can interact with migrated smart contracts
