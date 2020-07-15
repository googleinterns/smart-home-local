/// <reference types="@google/local-home-sdk" />
/// <reference types="@types/node" />
import test from 'ava';
import {injectSmarthomeStubs, extractMockLocalHomePlatform} from '../../src';
import {makeSendCommand, ControlKind} from '../../src/platform/device-manager';

// Set stub definition of smarthome.App and set intent enums
test.before(() => {
  injectSmarthomeStubs();
});

const DEVICE_ID = 'device-id-123';
const DEVICE_PORT = 12345;
const LOCAL_DEVICE_ID = 'local-device-id-123';
const BASE_SEND_COMMAND = makeSendCommand(
  ControlKind.HTTP,
  Buffer.from('sample-buffer')
);

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

function createDeviceCommand(
  requestId: string,
  deviceId: string,
  port: number
) {
  const deviceCommand = BASE_SEND_COMMAND;
  deviceCommand.requestId = requestId;
  deviceCommand.deviceId = deviceId;
  deviceCommand.port = port;
  return deviceCommand;
}

function getExecuteHandler(deviceManager: smarthome.DeviceManager) {
  return async (executeRequest: smarthome.IntentFlow.ExecuteRequest) => {
    const command = executeRequest.inputs[0].payload.commands[0];
    const device = command.devices[0];

    // Create execution response command success/failure.
    const executeResponse = new smarthome.Execute.Response.Builder().setRequestId(
      executeRequest.requestId
    );

    const deviceCommand = createDeviceCommand(
      executeRequest.requestId,
      device.id,
      DEVICE_PORT
    );

    try {
      const result = await deviceManager.send(deviceCommand);
      executeResponse.setSuccessState(result.deviceId, {});
    } catch (e) {
      executeResponse.setErrorState(device.id, e.errorCode);
    }
    return executeResponse.build();
  };
}
// Tests an execute flow end-to-end
test('execute-handler-registers-local-id', async t => {
  // Create the App to test against
  const app: smarthome.App = new smarthome.App('0.0.1');

  const deviceManager = app.getDeviceManager();
  const executeHandler = getExecuteHandler(deviceManager);

  // Set intent fulfillment handlers
  await app.onIdentify(identifyHandler).onExecute(executeHandler).listen();

  // Obtain the Mock Local Home Platform from the App stub
  const mockLocalHomePlatform = extractMockLocalHomePlatform(app)!;

  const discoveryBuffer = Buffer.from('sample-buffer');
  // Trigger an Identify intent from the platformn
  await t.notThrowsAsync(async () => {
    t.is(
      // This call will return the local device id
      await mockLocalHomePlatform.triggerIdentify(discoveryBuffer),
      LOCAL_DEVICE_ID
    );
  });

  // Double check our Identify handler did its job and returned the local device id
  t.is(mockLocalHomePlatform.getLocalDeviceIdMap().size, 1);
  t.is(
    mockLocalHomePlatform.getLocalDeviceIdMap().values().next().value,
    LOCAL_DEVICE_ID
  );
});
