import test from 'ava';
import {
  AppStub,
  ERROR_UNDEFINED_IDENTIFYHANDLER,
  ERROR_UNDEFINED_EXECUTEHANDLER,
} from '../../src/platform/smart-home-app';
import {injectSmarthomeStubs} from '../../src';

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

test.before(t => {
  injectSmarthomeStubs();
});

test('listen-with-undefined-identify-throws', async t => {
  const app: AppStub = new AppStub(APP_VERSION);
  await t.throwsAsync(app.listen(), {
    instanceOf: Error,
    message: ERROR_UNDEFINED_IDENTIFYHANDLER,
  });
});

test('listen-with-undefined-execute-throws', async t => {
  const app: AppStub = new AppStub(APP_VERSION);
  app.onIdentify(IDENTIFY_HANDLER);
  await t.throwsAsync(app.listen(), {
    instanceOf: Error,
    message: ERROR_UNDEFINED_EXECUTEHANDLER,
  });
});

test('listen-with-valid-handlers', async t => {
  const executeHandler: smarthome.IntentFlow.ExecuteHandler = () => {
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
  const app: AppStub = new AppStub(APP_VERSION);
  app.onIdentify(IDENTIFY_HANDLER).onExecute(executeHandler);
  const error = await app.listen();
  t.is(error, undefined);
});