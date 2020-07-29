/// <reference types="@google/local-home-sdk" />
import test from 'ava';
import {
  ERROR_UNDEFINED_VERIFICATIONID,
  ERROR_HANDLERS_NOT_SET,
  extractStubs,
} from '../../src';
import {createIdentifyHandler} from './test-platform-fixtures';
import {
  createUdpDeviceCommand,
  createExecuteHandler,
} from '../example/fixtures';

const DISCOVERY_BUFFER: Buffer = Buffer.from('discovery buffer 123');
const APP_VERSION: string = '0.0.1';
const DEVICE_ID: string = 'device-id-123';
const IDENTIFY_REQUEST_ID = 'identify-request-id';
/**
 * Tests that `listen()` was called on the created App.
 * This is a required flag that indicates handlers have been set.
 */
test('trigger-identify-without-listen-throws', async t => {
  const app: smarthome.App = new smarthome.App(APP_VERSION);
  await t.throws(
    () => {
      extractStubs(app);
    },
    {
      instanceOf: Error,
      message: ERROR_HANDLERS_NOT_SET,
    }
  );
});

/**
 * Tests that the returned `IdentifyResponse` contains a verificationId.
 */
test('trigger-identify-with-undefined-verificationId-throws', async t => {
  const app: smarthome.App = new smarthome.App(APP_VERSION);
  const deviceManager = app.getDeviceManager();
  const executeHandler = createExecuteHandler(
    createUdpDeviceCommand(
      Buffer.from('execute-buffer'),
      'execute-request-id',
      DEVICE_ID,
      12345
    ),
    deviceManager
  );
  const invalidIdentifyHandler: smarthome.IntentFlow.IdentifyHandler = () => {
    return {
      requestId: 'request-id',
      intent: smarthome.Intents.IDENTIFY,
      payload: {
        device: {
          id: DEVICE_ID,
        },
      },
    };
  };
  app.onIdentify(invalidIdentifyHandler).onExecute(executeHandler).listen();
  const {mockLocalHomePlatform} = extractStubs(app);
  await t.throwsAsync(
    mockLocalHomePlatform.triggerIdentify(
      IDENTIFY_REQUEST_ID,
      DISCOVERY_BUFFER
    ),
    {
      instanceOf: Error,
      message: ERROR_UNDEFINED_VERIFICATIONID,
    }
  );
});

/**
 * Tests `triggerIdentify()` when all requirements are met
 */
test('trigger-identify-with-valid-state', async t => {
  const discoveryBuffer = Buffer.from('discovery buffer 123');
  const localDeviceId = 'local-device-id-123';
  const app: smarthome.App = new smarthome.App(APP_VERSION);
  const deviceManager = app.getDeviceManager();
  const validIdentifyHandler = createIdentifyHandler(DEVICE_ID, localDeviceId);
  const validExecuteHandler = createExecuteHandler(
    createUdpDeviceCommand(
      Buffer.from('execute-buffer'),
      'execute-request-id',
      DEVICE_ID,
      12345
    ),
    deviceManager
  );
  app.onIdentify(validIdentifyHandler).onExecute(validExecuteHandler).listen();
  const {mockLocalHomePlatform} = extractStubs(app);
  await t.notThrowsAsync(async () => {
    const verificationId = await mockLocalHomePlatform.triggerIdentify(
      IDENTIFY_REQUEST_ID,
      discoveryBuffer
    );
    t.is(verificationId, localDeviceId);
  });
  t.notThrows(() => {
    t.is(mockLocalHomePlatform.isDeviceIdRegistered(DEVICE_ID), true);
  });
  t.notThrows(() => {
    t.is(mockLocalHomePlatform.getLocalDeviceId(DEVICE_ID), localDeviceId);
  });
});
