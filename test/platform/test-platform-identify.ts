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

test.before(t => {
  injectSmarthomeStubs();
});

test('only-trigger-identify-when-platform-initialized', async t => {
  const discoveryBuffer = Buffer.from('discovery buffer 123');
  const mockLocalHomePlatform = MockLocalHomePlatform.getInstance();
  const invalidIdentifyHandler: smarthome.IntentFlow.IdentifyHandler = () => {
    return {
      requestId: 'request-id',
      intent: smarthome.Intents.IDENTIFY,
      payload: {
        device: {
          id: 'device-id-123',
        },
      },
    };
  };
  const validIdentifyHandler: smarthome.IntentFlow.IdentifyHandler = () => {
    return {
      requestId: 'request-id',
      intent: smarthome.Intents.IDENTIFY,
      payload: {
        device: {
          id: 'device-id-123',
          verificationId: 'local-device-id-123',
        },
      },
    };
  };

  t.is(
    (
      await t.throwsAsync<Error>(
        mockLocalHomePlatform.triggerIdentify(discoveryBuffer)
      )
    ).message,
    ERROR_UNDEFINED_APP
  );

  const app: AppStub = new AppStub('0.0.1');

  t.is(
    (
      await t.throwsAsync<Error>(
        mockLocalHomePlatform.triggerIdentify(discoveryBuffer)
      )
    ).message,
    ERROR_LISTEN_NOT_CALLED
  );

  app.listen();

  t.is(
    (
      await t.throwsAsync<Error>(
        mockLocalHomePlatform.triggerIdentify(discoveryBuffer)
      )
    ).message,
    ERROR_UNDEFINED_IDENTIFYHANDLER
  );

  app.onIdentify(invalidIdentifyHandler);

  t.is(
    (
      await t.throwsAsync<Error>(
        mockLocalHomePlatform.triggerIdentify(discoveryBuffer)
      )
    ).message,
    ERROR_UNDEFINED_VERIFICATIONID
  );

  app.onIdentify(validIdentifyHandler);

  t.notThrows(() => {
    mockLocalHomePlatform.triggerIdentify(discoveryBuffer);
  });
});
