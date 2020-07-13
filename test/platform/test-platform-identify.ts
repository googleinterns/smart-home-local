/// <reference types="@google/local-home-sdk" />
import test from 'ava';
import {
  MockLocalHomePlatform,
  ERROR_UNDEFINED_IDENTIFYHANDLER,
  ERROR_UNDEFINED_APP,
  ERROR_LISTEN_NOT_CALLED,
  ERROR_UNDEFINED_VERIFICATIONID,
} from '../../src/platform/mock-local-home-platform';
import {AppStub} from '../../src/platform/smart-home-app';
import {injectSmarthomeStubs} from '../../src';

const DISCOVERY_BUFFER = Buffer.from('discovery buffer 123');
const APP_VERSION = '0.0.1';
const DEVICE_ID = 'device-id-123';

test.before(t => {
  injectSmarthomeStubs();
});

/**
 * Tests that a `MockLocalHomePlatform` on its own throws an error.
 * Identify functionality cannot continue if no App has been created.
 */
test('trigger-identify-with-undefined-app-throws', async t => {
  const mockLocalHomePlatform = MockLocalHomePlatform.getInstance(true);
  t.is(
    (
      await t.throwsAsync<Error>(
        mockLocalHomePlatform.triggerIdentify(DISCOVERY_BUFFER)
      )
    ).message,
    ERROR_UNDEFINED_APP
  );
});

/**
 * Tests that `listen()` was called on the created App.
 * This is a required flag that indicates handlers have been set.
 */
test('trigger-identify-without-listen-throws', async t => {
  const mockLocalHomePlatform = MockLocalHomePlatform.getInstance(true);
  const app: AppStub = new AppStub(APP_VERSION);
  t.is(
    (
      await t.throwsAsync<Error>(
        mockLocalHomePlatform.triggerIdentify(DISCOVERY_BUFFER)
      )
    ).message,
    ERROR_LISTEN_NOT_CALLED
  );
});

/**
 * Tests that the Identify handler was set on the `App` member.
 * Otherwise, there is no processor for an `IdentifyRequest`.
 */
test('trigger-identify-with-undefined-handler-throws', async t => {
  const mockLocalHomePlatform = MockLocalHomePlatform.getInstance(true);
  const app: AppStub = new AppStub(APP_VERSION);
  app.listen();
  t.is(
    (
      await t.throwsAsync<Error>(
        mockLocalHomePlatform.triggerIdentify(DISCOVERY_BUFFER)
      )
    ).message,
    ERROR_UNDEFINED_IDENTIFYHANDLER
  );
});

/**
 * Tests that the returned `IdentifyResponse` contains a verificationId.
 */
test('trigger-identify-with-undefined-verificationId-throws', async t => {
  const mockLocalHomePlatform = MockLocalHomePlatform.getInstance(true);
  const app: AppStub = new AppStub(APP_VERSION);
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
  app.onIdentify(invalidIdentifyHandler).listen();
  t.is(
    (
      await t.throwsAsync<Error>(
        mockLocalHomePlatform.triggerIdentify(DISCOVERY_BUFFER)
      )
    ).message,
    ERROR_UNDEFINED_VERIFICATIONID
  );
});

/**
 * Tests `triggerIdentify()` when all requirements are met
 */
test('trigger-identify-with-valid-state', async t => {
  const discoveryBuffer = Buffer.from('discovery buffer 123');
  const mockLocalHomePlatform = MockLocalHomePlatform.getInstance(true);
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
  const app: AppStub = new AppStub(APP_VERSION);
  app.onIdentify(validIdentifyHandler).listen();

  t.notThrows(() => {
    mockLocalHomePlatform.triggerIdentify(discoveryBuffer);
  });
  t.is(await mockLocalHomePlatform.getNextDeviceIdRegistered(), localDeviceId);
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

/**
 * Tests that the Local Home Platform is reset when `getInstance()` flag is set
 */
test('trigger-identify-with-reset-state', async t => {
  const oldPlatform = MockLocalHomePlatform.getInstance(true);
  //Implicitly attaches to current `MockLocalHomePlatform` singleton instance
  const app: AppStub = new AppStub(APP_VERSION);

  //Resets the singleton instance
  const mockLocalHomePlatform = MockLocalHomePlatform.getInstance(true);
  //Now expecting no attached `App`
  t.is(
    (
      await t.throwsAsync<Error>(
        mockLocalHomePlatform.triggerIdentify(DISCOVERY_BUFFER)
      )
    ).message,
    ERROR_UNDEFINED_APP
  );
});
