/*
 * Contains routings API v1.
 */

import { Router } from "express";
import multer from "multer";
import { notarizeFile, fetchFile } from "./notarizer";
import { serveFile } from "./filesystem";

// form-data memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const expirationTime = process.env.expirationTime || 60;

const docRouter = (module.exports = new Router());

//  @route   POST api/v1/notarization/notarize
//  @desc    Inserts new document to IPFS & blockchain
//  @access  Public
docRouter.post("/notarize", upload.single("file"), async (req, res) => {
  if (!req.is("multipart/form-data"))
    return res.status(400).send({
      success: false,
      error: "This API only takes multipart/form-data"
    });
  if (!req.file)
    return res.status(400).send({
      success: false,
      error: "No data found in request"
    });
  try {
    const result = await notarizeFile(req.file);
    return res.json({
      success: true,
      ethereum_txid: result.tx,
      ipfsHash: result.ipfsHash,
      blockNumber: result.blockNumber,
      id: result.id
    });
  } catch (err) {
    return res.status(500).send({
      success: false,
      error: "Error in notarization."
    });
  }
});

//  @route   GET api/v1/notarization/fetch/?id=[id]
//  @desc    Uses ID to get the hash from blockchain, and using that gets the data from IPFS
//  @access  Public
docRouter.get("/fetch", async (req, res) => {
  const identifier = req.query.id;
  const document = await fetchFile(identifier);
  const { link, expireTime } = await serveFile(
    document,
    indentifier,
    expirationTime
  );
  return res.json({
    success: true,
    link,
    timeNow: new Date().toLocaleString(),
    expirationTime,
    expires: expireTime.toLocaleString()
  });
});
