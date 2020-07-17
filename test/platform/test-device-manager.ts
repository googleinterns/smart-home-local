/// <reference types="@google/local-home-sdk" />
/// <reference types="@types/node" />
import test from 'ava';
import {
  makeSendCommand,
  extractMockLocalHomePlatform,
  DeviceManagerStub,
  Protocol,
  UdpResponseData,
} from '../../src';

const DEVICE_ID = 'device-id-123';
const DEVICE_PORT = 12345;
const LOCAL_DEVICE_ID = 'local-device-id-123';
const EXECUTE_REQUEST_ID = 'request-id-123';
const BASE_SEND_COMMAND = makeSendCommand(
  Protocol.UDP,
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
  const executeHandler = getExecuteHandler(app.getDeviceManager());

  // Set intent fulfillment handlers
  await app.onIdentify(identifyHandler).onExecute(executeHandler).listen();
  // Obtain the Mock Local Home Platform from the App stub
  const mockLocalHomePlatform = extractMockLocalHomePlatform(app)!;

  const discoveryBuffer = Buffer.from('sample-buffer');
  // Trigger an Identify intent from the platform, registering the device id
  await t.notThrowsAsync(async () => {
    t.is(
      // This call will return the local device id
      await mockLocalHomePlatform.triggerIdentify(
        'sample-request-id',
        discoveryBuffer
      ),
      LOCAL_DEVICE_ID
    );
  });

  const deviceManagerStub: DeviceManagerStub = mockLocalHomePlatform.getDeviceManager();

  const expectedCommand: smarthome.DataFlow.UdpRequestData = createDeviceCommand(
    EXECUTE_REQUEST_ID,
    DEVICE_ID,
    DEVICE_PORT
  );

  const expectedResponse: UdpResponseData = new UdpResponseData(
    EXECUTE_REQUEST_ID,
    DEVICE_ID
  );

  deviceManagerStub.addExpectedCommand(expectedCommand, expectedResponse);

  // Double check our Identify handler did its job and passed up the proper values
  t.is(mockLocalHomePlatform.isDeviceIdRegistered(DEVICE_ID), true);
  t.is(mockLocalHomePlatform.getLocalDeviceId(DEVICE_ID), LOCAL_DEVICE_ID);

  await t.notThrowsAsync(async () => {
    t.is(
      await mockLocalHomePlatform.triggerExecute(
        EXECUTE_REQUEST_ID,
        DEVICE_ID,
        'action.devices.commands.OnOff',
        {}
      ),
      'SUCCESS'
    );
  });
});
