/**
 * Remove path after given time
 */
const setSelfDestruct = (path, time) => {
  setTimeout(() => {
    fs.unlinkSync(path);
  }, time * 1000);
  let returnTime = new Date();
  returnTime = returnTime.setSeconds(returnTime.getSeconds() + time);
  return returnTime;
};

/**
 * Create local link path for fetched file
 */
const createLink = (identifier, document) => {
  const port = process.env.PORT || 5000;
  const deployUri = `${process.env.DEPLOY_URI}:${port}` || "localhost:5000";
  return `http://${deployUri}/files/${identifier}.${fileType(document).ext}`;
};

/**
 * Save file to local path and return link. Start self destruct on fetch.
 */
export const serveFile = async (document, identifier, expirationTime) => {
  const path = `./public/${identifier}.${fileType(document).ext}`;
  try {
    await fs.appendFileSync(path, document);
  } catch (err) {
    throw new Error("Cannot save fetched file to local path");
  }
  const expiryTimeEpoc = setSelfDestruct(path, expirationTime);
  return {
    link: createLink(identifier, document),
    expireTime: new Date(expiryTimeEpoc)
  };
};

export default serveFile;
