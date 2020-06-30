'use strict';
const fs = require('fs');
const jwt = require('jsonwebtoken');
const request = require('retry-request', {request: require('request')});

const createJwt = (projectId, privateKeyFile, algorithm) => {
  const token = {
    iat: parseInt(Date.now() / 1000),
    exp: parseInt(Date.now() / 1000) + 20 * 60, // 20 minutes
    aud: projectId,
  };
  const privateKey = fs.readFileSync(privateKeyFile);
  return jwt.sign(token, privateKey, {algorithm: algorithm});
};

var argv_projectId = '';
var argv_privateKeyFile = 'rsa_private.pem';
var argv_algorithm = 'RS256';
var argv_cloudRegion = 'europe-west1';
var argv_registryId = 'myregistry';
var argv_deviceId = 'iotcontroller_node';
var argv_messageType = 'events';
var argv_httpBridgeAddress = 'cloudiotdevice.googleapis.com';

const authToken = createJwt( argv_projectId, argv_privateKeyFile, argv_algorithm );
const devicePath = `projects/${argv_projectId}/locations/${argv_cloudRegion}/registries/${argv_registryId}/devices/${argv_deviceId}`;
const pathSuffix = argv_messageType === 'events' ? ':publishEvent' : ':setState';
const urlBase = `https://${argv_httpBridgeAddress}/v1/${devicePath}`;
const url = `${urlBase}${pathSuffix}`;

const publishAsync = (payload) => {
 
  console.log('Publishing message:', payload);
  const binaryData = Buffer.from(payload).toString('base64');
  const postData =
    argv_messageType === 'events'
      ? {
          binary_data: binaryData,
        }
      : {
          state: {
            binary_data: binaryData,
          },
        };

  const options = {
    url: url,
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
      'cache-control': 'no-cache',
    },
    body: postData,
    json: true,
    method: 'POST',
    retries: 2,
    shouldRetryFn: function (incomingHttpMessage) {
      return incomingHttpMessage.statusMessage !== 'OK';
    },
  };

  const delayMs = argv_messageType === 'events' ? 1000 : 2000;
  request(options, (error, response) => {
    if (error) {
      console.error('Received error: ', error);
    } else if (response.body.error) {
      console.error(`Received error: ${JSON.stringify(response.body.error)}`);
    } else {
      console.log('Message sent.');
    }
    
  });
};


exports.publishAsync = publishAsync;
