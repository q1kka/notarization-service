/*
* Contains routings API v1. 
*/

import { Router } from 'express';

//  Ethereum imports
import Web3 from 'web3';
import Contract from 'truffle-contract';

//  IPFS import
import IPFS from 'ipfs';

// Lib for encoding & decoding
import bs58 from 'bs58';

// Lib for figuring out the filetype of buffer
import fileType from 'file-type';

// Lib for creating unique ids
import uniqid from 'uniqid';

// Lib for generating a secret key
import NodeRSA from 'node-rsa';

import fs from 'fs';

// Lib for handling multipart/from-data
import multer from 'multer';
import timeStamp from 'time-stamp';
import POEApi from '../../smart_contract/build/contracts/POE.json';

//Lib for timestamp

// Utils
import isEmpty from '../utils/isEmpty';
import isExpired from '../utils/isExpired';
import expirations from '../utils/expirations';

// For encrypting and decrypting data
const privateKey = fs.readFileSync('./keys/rsa_512_key.pem');
const key = new NodeRSA({ keyData: privateKey }, { encryptionScheme: 'pkcs1' });

const storage = multer.memoryStorage();
const upload = multer({ storage });

const docRouter = (module.exports = new Router());

const ethNode = process.env.GETH || 'http://localhost:9545';

const web3 = new Web3(new Web3.providers.HttpProvider(ethNode));
const ipfs = new IPFS();
const Poe = new Contract(POEApi);
Poe.setProvider(web3.currentProvider);

// Workaround for "TypeError: Cannot read property 'apply' of undefined"
if (typeof Poe.currentProvider.sendAsync !== 'function') {
  Poe.currentProvider.sendAsync = function() {
    return Poe.currentProvider.send.apply(Poe.currentProvider, arguments);
  };
}

let account, poeContract;

// Gets accounts, sets contract's default account and sets the instance as poeContract
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

setInterval(() => {
  isExpired();
}, 5000);

//  @route   POST api/notarization/notarize
//  @desc    Inserts new document to IPFS & blockchain
//  @access  Public
docRouter.post('/notarize', upload.single('file'), async (req, res) => {
  let hashObject;
  // Check content-type
  if (!req.is('multipart/form-data'))
    res.status(400).send({
      success: false,
      error: 'This API only takes multipart/form-data'
    });
  if (req.file) {
    const buffer = key.encrypt(req.file.buffer);
    hashObject = await ipfs.files.add(buffer);
  } else {
    res.status(400).send({
      success: false,
      error: 'No data found in request'
    });
  }
  // Create unique id
  const id = uniqid();
  // Decodes the address sent from Ipfs and creates a hash which is then inserted into the blockchain. In case things go south, return an error.
  const bytes = bs58.decode(hashObject[0].path);
  const parsed = `0x${bytes.toString('hex').substring(4)}`;
  try {
    const result = await poeContract.addHash(id, parsed);
    res.json({
      success: true,
      ethereum_txid: result.tx,
      ipfs_hash: hashObject[0].path,
      block_number: result.receipt.blockNumber,
      id
    });
  } catch (error) {
    res.json({
      success: false,
      error: 'Fatal error in smart contract interaction'
    });
  }
});

//  @route   GET api/notarization/fetch/?id=[id]
//  @desc    Uses ID to get the hash from blockchain, and using that gets the data from IPFS
//  @access  Public
docRouter.get('/fetch', async (req, res) => {
  const identifier = req.query.id;
  const expiryTime = process.env.EXPIRYTIME || 300;
  try {
    // hash of the document is fetched from the blockchain
    // and converted to the right form so that it can be fetched
    // from ipfs
    const hash = await poeContract.getHash(identifier);
    const ipfsAddress = `1220${hash.substring(2)}`;
    const bytes = Buffer.from(ipfsAddress, 'hex');
    const text = bs58.encode(bytes);
    const document = await ipfs.files.get(text);

    // Check the file format of the file. If it is just json, convert it to utf-8 string and send in response
    if (fileType(key.decrypt(document[0].content)) == null) {
      const encryptedString = document[0].content;
      const decrypted = key.decrypt(encryptedString, 'utf-8');
      res.json({
        success: true,
        data: JSON.parse(decrypted)
      });
    }
    // If file is not text, send link to gateway instead.
    else {
      const encryptedFile = document[0].content;
      const decrypted = key.decrypt(encryptedFile);

      //Try to append the data to file and add expiration
      try {
        fs.appendFileSync(
          `./public/${text}.${fileType(decrypted).ext}`,
          decrypted
        );
        const fetchingDate = new Date().getTime();
        const obj = {
          file_path: `./public/${text}.${fileType(decrypted).ext}`,
          fetching_date: fetchingDate
        };
        expirations.addExpiration(obj);
        const absoluteExpiration = new Date(fetchingDate);
        absoluteExpiration.setSeconds(
          absoluteExpiration.getSeconds() + expiryTime
        );
        absoluteExpiration.setMinutes(
          absoluteExpiration.getMinutes() -
            absoluteExpiration.getTimezoneOffset()
        );
        //Return a link to the file + link expiry time
        res.json({
          success: true,
          link: `http://localhost:3000/files/${text}.${
            fileType(decrypted).ext
          }`,
          expires: absoluteExpiration.toISOString()
        });
      } catch (err) {
        //Handle the error
        res.json({
          success: false
        });
      }
    }
    // if something goes wrong, a status code 400 is sent
    // and also error message
  } catch (err) {
    res.status(400).send(err.message);
  }
});

//  @route   GET api/notarization/validate
//  @desc    Endpoint to check if a certain document is notarized and therefor valid
//  @access  Public
docRouter.get('/validate', async (req, res) => {
  const obj = {};
  const date = await poeContract.getTimestamp(req.query.id);
  res.json({ isNotarized: true, date: date.c[0] });
});
