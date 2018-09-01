/**
 * A function to check if a document is deleted. If it is expired, the document is deleted
 */

import fs from 'fs';
import expirations from './expirations';
import isEmpty from './isEmpty';

function isExpired() {
  //Fetching the expiring files. If the array is empty, nothing is done
  const array = expirations.getExpirations();
  if (isEmpty(array)) return;

  //Else the file is deleted
  try {
    const now = new Date().getTime();
    console.log(`Time: ${now - array[0].fetching_date} ms`);
    array.map(item => {
      // Calculate the remainder of the current time and the time of fetching (in milliseconds)
      if (now - item.fetching_date > 60000) {
        fs.unlinkSync(item.file_path);
        array.pop(item);
        console.log('file deleted');
      }
    });
  } catch (err) {
    console.log(err.message);
  }
}

export default isExpired;
