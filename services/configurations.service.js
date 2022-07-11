const axios = require('axios');
const API_URL = process.env.CONFIGURATIONS_API_URL || 'https://developers.paysera.com/tasks/api';
const GET = 'GET';

const createApiRequest = (server, method, route) =>
  axios(
	  {
	    method,
	    url: server + route,
	    headers: {
	      'Content-Type': 'application/json'
	    },
	  }
  )
  .catch((error) => {
    console.error(error);
  });

exports.getCashIn = () =>
  createApiRequest(API_URL, GET, '/cash-in');
exports.getCashOutNatural = (data) =>
  createApiRequest(API_URL, GET, '/cash-out-natural');
exports.getCashOutJuridical = (data) =>
  createApiRequest(API_URL, GET, '/cash-out-juridical');
