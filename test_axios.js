const axios = require('axios');

const mediaApi = axios.create({
  baseURL: "/api/v1",
  timeout: 120000,
});

console.log(mediaApi.getUri({url: "/accounts/1/dialogs/123/avatar"}));
console.log(mediaApi.getUri({url: "accounts/1/dialogs/123/avatar"}));
