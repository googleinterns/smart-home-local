/*
 * Example tests against stubs
 */
/// <reference types="@google/local-home-sdk" />
/// <reference types="@types/node" />
import test from 'ava';
import {extractMockLocalHomePlatform, AppStub} from '../../src';

const DEVICE_ID = 'device-id-123';
const LOCAL_DEVICE_ID = 'local-device-id-123';

// Sample Identify handler that is tested against
const identifyHandler: smarthome.IntentFlow.IdentifyHandler = (
  identifyRequest: smarthome.IntentFlow.IdentifyRequest
) => {
  return {
    requestId: identifyRequest.requestId,
    intent: smarthome.Intents.IDENTIFY,
    payload: {
      device: {
        id: DEVICE_ID,
        verificationId: LOCAL_DEVICE_ID,
      },
    },
  };
};

// Sample Execute handler that is tested against
const executeHandler: smarthome.IntentFlow.ExecuteHandler = (
  executeRequest: smarthome.IntentFlow.ExecuteRequest
) => {
  return {
    requestId: executeRequest.requestId,
    intent: smarthome.Intents.IDENTIFY,
    payload: {
      commands: [
        {
          ids: ['123'],
          status: 'SUCCESS',
          states: {
            on: true,
            online: true,
          },
        },
        {
          ids: ['456'],
          status: 'ERROR',
          errorCode: 'deviceTurnedOff',
        },
      ],
    },
  };
};

// Tests an identify flow end-to-end
test('identify-handler-registers-local-id', async t => {
  // Create the App to test against
  const app: smarthome.App = new smarthome.App('0.0.1');

  // Set intent fulfillment handlers
  await app.onIdentify(identifyHandler).onExecute(executeHandler).listen();

  // Obtain the Mock Local Home Platform from the App stub
  const mockLocalHomePlatform = extractMockLocalHomePlatform(app);

  const discoveryBuffer = Buffer.from('sample-buffer');

  // Trigger an Identify intent from the platformn
  await t.notThrowsAsync(async () => {
    t.is(
      // This call will return the local device id
      await mockLocalHomePlatform.triggerIdentify(
        'identify-request-id',
        discoveryBuffer
      ),
      LOCAL_DEVICE_ID
    );
  });

  // Double check our Identify handler did its job and returned the local device id
  t.is(mockLocalHomePlatform.isDeviceIdRegistered(DEVICE_ID), true);
  t.is(mockLocalHomePlatform.getLocalDeviceId(DEVICE_ID), LOCAL_DEVICE_ID);
});


