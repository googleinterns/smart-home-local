/// <reference types="@google/local-home-sdk" />
/// <reference types="@types/node" />
import test from 'ava';
import {
  extractStubs,
  UdpResponseData,
  ERROR_EXECUTE_RESPONSE_ERROR_STATUS,
} from '../../src';
import {createIdentifyHandler} from './test-platform-fixtures';
import {
  createUdpDeviceCommand,
  createExecuteHandler,
} from '../example/fixtures';

const DEVICE_ID = 'device-id-123';
const DEVICE_PORT = 12345;
const LOCAL_DEVICE_ID = 'local-device-id-123';
const EXECUTE_REQUEST_ID = 'request-id-123';

async function registerDevice(
  app: smarthome.App,
  executeHandler: smarthome.IntentFlow.ExecuteHandler,
  deviceId: string,
  localDeviceId: string
): Promise<void> {
  const identifyHandler = createIdentifyHandler(deviceId, localDeviceId);
  await app.onIdentify(identifyHandler).onExecute(executeHandler).listen();
  await extractStubs(app).mockLocalHomePlatform.triggerIdentify(
    'identify-request-id',
    Buffer.from('test-buffer'),
    deviceId
  );
  Promise.resolve();
}

function createSimpleExecuteCommands(
  deviceId: string,
  command: string,
  params: Record<string, unknown> = {}
): smarthome.IntentFlow.ExecuteRequestCommands {
  return {
    devices: [{id: deviceId}],
    execution: [{command, params}],
  };
}

/**
 * Tests that a valid Execute request and handler pair
 * will result in a `SUCCESS`.
 */
test('execute-handler-command-success', async t => {
  // Create the App and source Device Manager
  const app = new smarthome.App('0.0.1');

  // Create a valid request for the Execute call
  const validCommand: smarthome.DataFlow.UdpRequestData = createUdpDeviceCommand(
    Buffer.from('test-execute-buffer'),
    EXECUTE_REQUEST_ID,
    DEVICE_ID,
    DEVICE_PORT
  );

  // Create an Execute handler that sends a valid command
  const executeHandler = createExecuteHandler(
    validCommand,
    app.getDeviceManager()
  );

  await registerDevice(app, executeHandler, DEVICE_ID, LOCAL_DEVICE_ID);
  const stubs = extractStubs(app);

  // Prepare the stub to expect the command
  stubs.deviceManagerStub.addExpectedCommand(
    validCommand,
    new UdpResponseData(EXECUTE_REQUEST_ID, DEVICE_ID)
  );

  const executeCommands = createSimpleExecuteCommands(
    DEVICE_ID,
    'action.devices.commands.OnOff'
  );

  // Trigger an Execute intent and confirm a `CommandSuccess`
  await t.notThrowsAsync(async () => {
    const executeResponseCommands = await stubs.mockLocalHomePlatform.triggerExecute(
      EXECUTE_REQUEST_ID,
      [executeCommands]
    );
    t.is(executeResponseCommands[0].status, 'SUCCESS');
  });
});

/**
 * Tests that sending a non-matching command will result in an `ERROR`
 */
test('execute-handler-sends-wrong-buffer', async t => {
  // Create the App and source Device Manager
  const app: smarthome.App = new smarthome.App('0.0.1');
  const expectedCommand = createUdpDeviceCommand(
    Buffer.from('test-execute-buffer'),
    EXECUTE_REQUEST_ID,
    DEVICE_ID,
    DEVICE_PORT
  );
  const unexpectedCommand = createUdpDeviceCommand(
    Buffer.from('incorrect-buffer'),
    EXECUTE_REQUEST_ID,
    DEVICE_ID,
    DEVICE_PORT
  );

  // Create an Execute handler that passes in an unexpected command
  const executeHandler = createExecuteHandler(
    unexpectedCommand,
    app.getDeviceManager()
  );

  // Register the device with Identify
  await registerDevice(app, executeHandler, DEVICE_ID, LOCAL_DEVICE_ID);

  const stubs = extractStubs(app);

  // Prepare the stub to expect a command
  stubs.deviceManagerStub.addExpectedCommand(
    expectedCommand,
    new UdpResponseData(EXECUTE_REQUEST_ID, DEVICE_ID)
  );

  // Create a valid Execute command to trigger executeHandler
  const executeCommands = createSimpleExecuteCommands(
    DEVICE_ID,
    'action.devices.commands.OnOff'
  );

  // Trigger the Execute handler and confirm a `CommandFailure`
  await t.throwsAsync(
    async () => {
      await stubs.mockLocalHomePlatform.triggerExecute(EXECUTE_REQUEST_ID, [
        executeCommands,
      ]);
    },
    {
      instanceOf: Error,
      message: ERROR_EXECUTE_RESPONSE_ERROR_STATUS,
    }
  );

  // Check out unexpected command was sent
  t.is(stubs.deviceManagerStub.wasCommandSent(unexpectedCommand), true);
});
