/**
 * A couple of function for handling fetched files that are going to expire
 */

let expirations = [];

function addExpiration(object) {
  expirations.push(object);
  //Remove duplicate objects if the array contains any
  expirations = expirations.filter((obj, pos, arr) => {
    return arr.map(mapObj => mapObj.file_path).indexOf(obj.file_path) === pos;
  });
}

function getExpirations() {
  return expirations;
}

export default { addExpiration, getExpirations };
