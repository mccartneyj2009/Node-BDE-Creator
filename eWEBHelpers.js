const axios = require("axios");
const prompt = require("prompt-sync")({ sigint: true });

/**
 * Function used to prove that the user credentials are valid and the user can perform operations on the enteliWEB server.
 * @param {Object} Object An object which contains an IP address or localhost, a username string, and a password string.
 * @returns {Object} Object
 */
async function ewebAuthentication({
  address = "localhost",
  username,
  password,
}) {
  const AUTH_URL = `http://${address}/enteliweb/api/auth/basiclogin?alt=json`;

  const options = basicHeadersForRequest(username, password);

  try {
    const response = await axios.get(AUTH_URL, options);
    if (response) {
      return { response: response.data };
    }
  } catch (error) {
    if (error.response) {
      return { response: error.response.data.errorText };
    } else if (error.request) {
      return {
        response: `No response received from ${error.request._currentUrl}`,
      };
    }
  }
}

/**
 * Used to retrieve all of the sites on an enteliWEB server
 * @param {Object} Object An object which contains an IP address or localhost, a username string, and a password string.
 * @returns {Array} An array of site name strings on the server being access.
 */
async function getAllSites({ address = "localhost", username, password }) {
  const GET_ALL_SITES_URL = `http://${address}/enteliweb/api/.bacnet?alt=json`;

  const options = basicHeadersForRequest(username, password);

  try {
    const response = await axios.get(GET_ALL_SITES_URL, options);
    const { data } = response;
    const sitesArr = [];

    for (const key in data) {
      if (typeof data[key] === "object") {
        sitesArr.push(key);
      }
    }
    return sitesArr;
  } catch (error) {
    console.log(error);
  }
}
/**
 * Used to get a list of controllers from a site that the user has selected.
 * @param {Object} Object An object which contains an IP address or localhost, a username string, and a password string.
 * @param {String} siteName
 * @returns {Object} Returns and object of controllers at the site that had been previously selected.
 */
async function getControllersFromSite(
  { address = "localhost", username, password },
  siteName
) {
  const GET_ALL_CONTROLLERS_URL = `http://${address}/enteliweb/api/.bacnet/${siteName}?alt=json`;

  const options = basicHeadersForRequest(username, password);

  try {
    const response = await axios.get(GET_ALL_CONTROLLERS_URL, options);
    const { data } = response;
    const controllers = {};

    for (const key in data) {
      if (parseInt(key)) {
        // console.log(`${key}: ${data[key].displayName}`);
        controllers[key] = data[key].displayName;
      }
    }
    return controllers;
  } catch (error) {
    console.log(error);
  }
}

/**
 *
 * @param {Object} Object An object which contains an IP address or localhost, a username string, and a password string.
 * @param {String} siteName A string containing the site name where the controller to be written to is located.
 * @param {String} targetController A string of the target controllers BACnet address
 * @param {String} rootController A string of the root controllers BACnet address
 */
async function createBdeInTargetController(
  { address = "localhost", username, password },
  siteName,
  targetController,
  rootController
) {
  //Check for existing BDEs
  const GET_OBJECTS_URL = `http://${address}/enteliweb/api/.bacnet/${siteName}/${targetController}?alt=json`;
  const options = basicHeadersForRequest(username, password);

  // Get the BDEs that are in the controller
  try {
    const response = await axios.get(GET_OBJECTS_URL, options);
    const objects = response.data;
    const bdeInstanceArr = [];

    for (const key in objects) {
      if (key.includes("bde")) {
        const arr = key.split(",");
        bdeInstanceArr.push(arr[1]);
      }
    }

    //Create BDE
    const CREATE_BDE_URL = `http://${address}/enteliweb/api/.bacnet/${siteName}/${targetController}?alt=json`;

    const body = {
      $base: "Object",
      "object-identifier": {
        $base: "ObjectIdentifier",
        value: `BDE,${Math.max(...bdeInstanceArr) + 1}`,
      },
      "object-name": {
        $base: "String",
        value: `${rootController} BDE`,
      },
    };

    try {
      const { data } = await axios.post(CREATE_BDE_URL, body, options);
      console.log(data.errorText);
      // return data;
    } catch (error) {
      console.log(error.response.data.errorText);
    }
  } catch (error) {
    console.log(error.response.data.errorText);
  }
}

/**
 * Used to get the user information to login and perform operations on an enteliWEB server. User credentials must be valid on the server.
 * @returns {Object} An object containing an address, username, and password.
 */
function getUserInformation() {
  const address = prompt(
    "IP address (leave empty if working on target server): "
  );
  const username = prompt("Username: ");
  const password = prompt("Password: ", { echo: "*" });
  return { address, username, password };
}

/**
 * Must provide a username and password. Function will return an object to used for options in a http request.
 * @param {String} username
 * @param {String} password
 * @returns {Object} Object
 */
function basicHeadersForRequest(username, password) {
  encodedString = btoa(`${username}:${password}`);
  const options = {
    headers: {
      Authorization: `Basic ${encodedString}`,
    },
  };
  return options;
}

module.exports = {
  getUserInformation,
  ewebAuthentication,
  getAllSites,
  getControllersFromSite,
  createBdeInTargetController,
};
