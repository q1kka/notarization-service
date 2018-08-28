/*
* Contains routings for /api/doc
*/

import { Router } from 'express';

//Ethereum imports
import Web3 from 'web3';
import Contract from 'truffle-contract';
import POEApi from '../../smart_contract/build/contracts/POE.json';

//IPFS import
import IPFS from 'ipfs';

//Lib for encoding & decoding
import bs58 from 'bs58';

//Lib for creating unique ids
import uniqid from 'uniqid';

const docRouter = (module.exports = new Router());

const ethNode = process.env.GETH || 'http://localhost:9545';

const web3 = new Web3(new Web3.providers.HttpProvider(ethNode));
const ipfs = new IPFS();
const Poe = new Contract(POEApi);
Poe.setProvider(web3.currentProvider);

//Workaround for "TypeError: Cannot read property 'apply' of undefined"
if (typeof Poe.currentProvider.sendAsync !== 'function') {
	Poe.currentProvider.sendAsync = function() {
		return Poe.currentProvider.send.apply(Poe.currentProvider, arguments);
	};
}

let account, poeContract;

//Gets accounts, sets contract's default account and sets the instance as poeContract
web3.eth
	.getAccounts()
	.then(accounts => {
		account = accounts[0];
		Poe.web3.eth.defaultAccount = account;
		return Poe.deployed();
	})
	.then(instance => {
		poeContract = instance;
	});

// @route   POST api/doc/insert
// @desc    Inserts new document to IPFS & blockchain
// @access  Public
docRouter.post('/insert', async (req, res) => {
	//Make sure data is not empty, and if it is, return error
	try {
		if (req.body.data.length < 1) {
			return res.sendStatus(400);
		}
	} catch (error) {
		res.json({
			success: false,
			error: "Data can't be empty"
		});
		return;
	}

	//Create a buffer and send the data to the IPFS database
	let buffer = Buffer.from(req.body.data);
	let hashObject = await ipfs.files.add(buffer);

	//Create unique id
	const id = uniqid();

	//Decodes the address sent from Ipfs and creates a hash which is then inserted into the blockchain. In case things go south, return an error.
	const bytes = bs58.decode(hashObject[0].path);
	const parsed = '0x' + bytes.toString('hex').substring(4);
	try {
		let result = await poeContract.addHash(id, parsed);
		res.json({
			success: true,
			id: id
		});
	} catch (error) {
		res.json({
			success: false,
			error
		});
	}
});

// @route   POST api/doc/get_doc
// @desc    Uses ID to get the hash from blockchain, and using that gets the data from IPFS
// @access  Public
docRouter.post('/get_doc', async (req, res) => {
	try {
		//hash of the document is fetched from the blockchain
		//and converted to the right form so that it can be fetched
		//from ipfs
		const hash = await poeContract.getHash(req.body.data);
		const ipfsAddress = '1220' + hash.substring(2);
		const bytes = Buffer.from(ipfsAddress, 'hex');
		const text = bs58.encode(bytes);
		const document = await ipfs.files.get(text);

		//document is sent
		res.send(document[0].content.toString('utf-8'));

	//if something goes wrong, a status code 400 is sent
	//and also error message
	}catch(err) {
		res.status(400).send(err.message)
	}
});

// @route   POST api/doc/is_valid
// @desc    Endpoint to check if a certain document is notarized and therefor valid
// @access  Public
docRouter.post('/is_valid', async (req, res) => {
	let obj = {}
	let isNotarized = await poeContract.isNotarized(req.body.data);

	//if document is notarized then notarization is marked as true
	//and date of the notarizatioin is added to the object
	if(isNotarized) {
		obj = {
			isNotarized: true,
			date: await poeContract.getTimestamp(req.body.data)
		}
	//else notarization is marked as false, and date marked as null
	} else {
		obj= {
			isNotarized: false,
			date: null
		}
	}
	
	//returns the objects
	res.send(obj);
});
