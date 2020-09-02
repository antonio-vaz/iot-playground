'use strict';

 const topicName = 'projects/projectdemo1-286822/topics/iot-event';

  const {PubSub} = require('@google-cloud/pubsub');

  const pubSubClient = new PubSub();

  async function publishMessageWithCustomAttributes(data) {
    const dataBuffer = Buffer.from(data);

    // Add two custom attributes, origin and username, to the message
    const customAttributes = {
      origin: 'nodejs-sample',
      username: 'gcp',
    };

    const messageId = await pubSubClient
      .topic(topicName)
      .publish(dataBuffer, customAttributes);
    console.log(`Message ${messageId} published.`);
  }

  exports.publishEvent = publishMessageWithCustomAttributes;
