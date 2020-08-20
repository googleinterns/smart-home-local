/**
 * Tests the `AppStub` class.
 */
/// <reference types="@google/local-home-sdk" />
import test from 'ava';
import {
  ERROR_LISTEN_WITHOUT_IDENTIFY_HANDLER,
  ERROR_LISTEN_WITHOUT_EXECUTE_HANDLER,
} from '../../src';

const APP_VERSION = '0.0.1';
const IDENTIFY_HANDLER: smarthome.IntentFlow.IdentifyHandler = () => {
  return {
    requestId: 'request-id',
    intent: smarthome.Intents.IDENTIFY,
    payload: {
      device: {
        id: 'device-id-222',
        verificationId: 'local-device-id-222',
      },
    },
  };
};

/**
 * Tests that a call to `listen()` without setting any required handlers fails.
 */
test('listen-with-undefined-identify-throws', async t => {
  const app: smarthome.App = new smarthome.App(APP_VERSION);
  await t.throwsAsync(
    async () => {
      await app.listen();
    },
    {
      instanceOf: Error,
      message: ERROR_LISTEN_WITHOUT_IDENTIFY_HANDLER,
    }
  );
});

/**
 * Tests that a call to `listen()` having only set the identify handler fails.
 */
test('listen-with-undefined-execute-throws', async t => {
  const app: smarthome.App = new smarthome.App(APP_VERSION);
  app.onIdentify(IDENTIFY_HANDLER);
  await t.throwsAsync(
    async () => {
      await app.listen();
    },
    {
      instanceOf: Error,
      message: ERROR_LISTEN_WITHOUT_EXECUTE_HANDLER,
    }
  );
});

/**
 * Tests that a call to `listen()` with Identify and Execute handlers
 * finishes without error.
 */
test('listen-with-valid-handlers', async t => {
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
  const app: smarthome.App = new smarthome.App(APP_VERSION);
  app.onIdentify(IDENTIFY_HANDLER).onExecute(executeHandler);
  const error = await app.listen();
  t.is(error, undefined);
});
