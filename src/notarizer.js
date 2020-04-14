import Web3 from "web3";
import Contract from "truffle-contract";
import ipfsClient from "ipfs-http-client";
import bs58 from "bs58";
import uniqid from "uniqid";
import crypto from "crypto";
import POEApi from "../smart_contract/build/contracts/POE.json";

const algorithm = "aes-256-ctr";
const encryptKey = process.env.ENCRYPT_KEY || "development dummy key";

const ipfsAddress = process.env.IPFS_NODE || "localhost:5001";
const ipfsNode = ipfsClient(ipfsAddress);

/**
 * Init web3 & smart contract
 */
const initEthereum = async () => {
  let poeContract;
  const ethNode = process.env.GETH || "http://localhost:9545";
  const web3 = new Web3(new Web3.providers.HttpProvider(ethNode));
  const Poe = new Contract(POEApi);
  Poe.setProvider(web3.currentProvider);
  // Workaround for "TypeError: Cannot read property 'apply' of undefined"
  if (typeof Poe.currentProvider.sendAsync !== "function") {
    Poe.currentProvider.sendAsync = function() {
      return Poe.currentProvider.send.apply(Poe.currentProvider, arguments);
    };
  }
  // Gets accounts, sets contract's default account and sets the instance as poeContract
  await web3.eth
    .getAccounts()
    .then(accounts => {
      Poe.web3.eth.defaultAccount = accounts[0];
      return Poe.deployed();
    })
    .then(instance => {
      poeContract = instance;
    });
  return poeContract;
};

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

/**
 * Notarize file in IPFS & add hash to smart contract
 * @param file file to be notarized
 */
export const notarizeFile = async file => {
  const poeContract = await initEthereum();
  const encryptedBuffer = encrypt(file.buffer);
  const id = uniqid("NT");
  try {
    const added = await ipfsNode.add({
      path: id,
      content: encryptedBuffer
    });
    const bytes = bs58.decode(added[0].path);
    const parsed = `0x${bytes.toString("hex").substring(4)}`;
    const result = await poeContract.addHash(id, "asd");
    return {
      tx: result.tx,
      ipfsHash: added[0].path,
      blockNumber: result.receipt.blockNumber,
      id
    };
  } catch (error) {
    throw new Error("Error in file notarization!");
  }
};

/**
 * Fetch file from IPFS & decrypt
 */
export const fetchFile = async identifier => {
  try {
    // hash of the document is fetched from the blockchain
    // and converted to the right form so that it can be fetched from ipfs
    const hash = await poeContract.getHash(identifier);
    const ipfsPath = `1220${hash.substring(2)}`;
    const bytes = Buffer.from(ipfsPath, "hex");
    const encoded = bs58.encode(bytes);
    const encryptedDocument = await ipfs.files.get(encoded);
    const decryptedDocument = decrypt(encryptedDocument[0].content);
    return decryptedDocument;
  } catch (err) {
    throw new Error("Error fetching the file!");
  }
};
