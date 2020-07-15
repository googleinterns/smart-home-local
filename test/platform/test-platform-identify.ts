/// <reference types="@google/local-home-sdk" />
import test from 'ava';
import {
  ERROR_LISTEN_NOT_CALLED,
  ERROR_UNDEFINED_VERIFICATIONID,
  extractMockLocalHomePlatform,
  injectSmarthomeStubs,
} from '../../src';

const DISCOVERY_BUFFER: Buffer = Buffer.from('discovery buffer 123');
const APP_VERSION: string = '0.0.1';
const DEVICE_ID: string = 'device-id-123';
const EXECUTE_HANDLER: smarthome.IntentFlow.ExecuteHandler = () => {
  return {
    requestId: 'request-id',
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

/**
 * Inject stubs into smarthome namespace
 * Assert no active AppStub
 */
test.before(t => {
  injectSmarthomeStubs();
});

/**
 * Tests that `listen()` was called on the created App.
 * This is a required flag that indicates handlers have been set.
 */
test('trigger-identify-without-listen-throws', async t => {
  const app: smarthome.App = new smarthome.App(APP_VERSION);
  const mockLocalHomePlatform = extractMockLocalHomePlatform(app)!;
  await t.throwsAsync(mockLocalHomePlatform.triggerIdentify(DISCOVERY_BUFFER), {
    instanceOf: Error,
    message: ERROR_LISTEN_NOT_CALLED,
  });
});

/**
 * Tests that the returned `IdentifyResponse` contains a verificationId.
 */
test('trigger-identify-with-undefined-verificationId-throws', async t => {
  const app: smarthome.App = new smarthome.App(APP_VERSION);
  const mockLocalHomePlatform = extractMockLocalHomePlatform(app)!;
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
  app.onIdentify(invalidIdentifyHandler).onExecute(EXECUTE_HANDLER).listen();
  await t.throwsAsync(mockLocalHomePlatform.triggerIdentify(DISCOVERY_BUFFER), {
    instanceOf: Error,
    message: ERROR_UNDEFINED_VERIFICATIONID,
  });
});

/**
 * Tests `triggerIdentify()` when all requirements are met
 */
test('trigger-identify-with-valid-state', async t => {
  const discoveryBuffer = Buffer.from('discovery buffer 123');
  const localDeviceId = 'local-device-id-123';
  const validIdentifyHandler: smarthome.IntentFlow.IdentifyHandler = () => {
    return {
      requestId: 'request-id',
      intent: smarthome.Intents.IDENTIFY,
      payload: {
        device: {
          id: DEVICE_ID,
          verificationId: localDeviceId,
        },
      },
    };
  };
  const app: smarthome.App = new smarthome.App(APP_VERSION);
  app.onIdentify(validIdentifyHandler).onExecute(EXECUTE_HANDLER).listen();
  const mockLocalHomePlatform = extractMockLocalHomePlatform(app)!;
  await t.notThrowsAsync(async () => {
    const verificationId = await mockLocalHomePlatform.triggerIdentify(
      discoveryBuffer
    );
    t.is(verificationId, localDeviceId);
  });
  t.is(mockLocalHomePlatform.getLocalDeviceIdMap().size, 1);
  t.is(
    mockLocalHomePlatform.getLocalDeviceIdMap().keys().next().value,
    DEVICE_ID
  );
  t.is(
    mockLocalHomePlatform.getLocalDeviceIdMap().values().next().value,
    localDeviceId
  );
});
