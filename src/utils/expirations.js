/**
 * A couple of function for handling fetched files that are going to expire
 */

const expirations = [];

function addExpiration(object) {
  expirations.push(object);
}

function getExpirations() {
  return expirations;
}

export default { addExpiration, getExpirations };
