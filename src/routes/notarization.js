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

// Lib for encryption
import ursa from 'ursa';
import fs from 'fs';

// Lib for handling multipart/from-data
import multer from 'multer';

// Encrypting and decrypting data
import crypto from 'crypto';

// Smart contract
import POEApi from '../../smart_contract/build/contracts/POE.json';

// Utils
import isEmpty from '../utils/isEmpty';
import isExpired from '../utils/isExpired';
import expirations from '../utils/expirations';

// Encrypt settings
const algorithm = 'aes-256-ctr';
const encryptKey = process.env.ENCRYPTKEY || 'development dummy key';

// form-data memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const docRouter = (module.exports = new Router());

// ETH node settings
const ethNode = process.env.GETH || 'http://localhost:9545';
const web3 = new Web3(new Web3.providers.HttpProvider(ethNode));
const Poe = new Contract(POEApi);
Poe.setProvider(web3.currentProvider);
// Workaround for "TypeError: Cannot read property 'apply' of undefined"
if (typeof Poe.currentProvider.sendAsync !== 'function') {
  Poe.currentProvider.sendAsync = function () {
    return Poe.currentProvider.send.apply(Poe.currentProvider, arguments);
  };
}

const ipfs = new IPFS();

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

const encrypt = buffer => {
  const cipher = crypto.createCipher(algorithm, encryptKey);
  const crypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return crypted;
};

const decrypt = buffer => {
  const decipher = crypto.createDecipher(algorithm, encryptKey);
  const dec = Buffer.concat([decipher.update(buffer), decipher.final()]);
  return dec;
};

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
    const encryptedBuffer = encrypt(req.file.buffer);
    hashObject = await ipfs.files.add(encryptedBuffer);
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
  let encryptedDocument, decryptedDocument;
  try {
    // hash of the document is fetched from the blockchain
    // and converted to the right form so that it can be fetched from ipfs
    const hash = await poeContract.getHash(identifier);
    const ipfsAddress = `1220${hash.substring(2)}`;
    const bytes = Buffer.from(ipfsAddress, 'hex');
    const encoded = bs58.encode(bytes);
    encryptedDocument = await ipfs.files.get(encoded);
  } catch (err) {
    res.status(500).json({ success: false, error: 'IPFS error' });
  }
  try {
    decryptedDocument = decrypt(encryptedDocument[0].content);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error in decrypting' });
  }
  //Try to append the data to file and add expiration
  try {
    fs.appendFileSync(
      `./public/${identifier}.${fileType(decryptedDocument).ext}`,
      decryptedDocument
    );
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: 'Error writing file to disk' });
  }
  //Return a link to the file + link expiry time
  res.json({
    success: true,
    link: `http://localhost:3000/files/${identifier}.${
      fileType(decryptedDocument).ext
      }`
  });
});
