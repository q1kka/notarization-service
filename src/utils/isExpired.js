/**
 * A function to check if a document is expired. If it is expired, the document is deleted
 */

import fs from 'fs';
import expirations from './expirations';
import isEmpty from './isEmpty';

function isExpired() {
  //Expiry time in seconds
  const expiryTime = process.env.EXPIRYTIME || 5000;
  //Fetching the expiring files. If the array is empty, nothing is done
  const array = expirations.getExpirations();
  if (isEmpty(array)) {
    return;
  }
  //Else the file is deleted
  try {
    const now = new Date().getTime();
    array.map(item => {
      if (now - item.fetching_date > expiryTime) {
        fs.unlinkSync(item.file_path);
        array.pop(fileToBeDeleted);
      }
    });
  } catch (err) {
    console.log(err.message);
  }
}

export default isExpired;
