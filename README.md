# notarization-component

Notarization component is system used to notarize text or files in distributed fashion. It exposes RESTful api for which can take JSON objects / strings as ´application/json´ data or other files as ´multipart/form-data´.

## Environment

This program uses environmental variables for configurations in production. Out of box software works in development mode. In development mode preset enviroment is used.

When in production, following enviromental variables must be set;

```
PORT=[port to listen to]
GETH=[ip:port for ethereum node]
```

## NPM scripts

```
npm start - Starts the application with nodemon and babel
npm run build - Build application for production use
npm run serve - Start the production application
```

## Smart contract setup for development enviroment

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
