/*
 * Example tests against a fulfillment's executeHandler.
 */
/// <reference types="@google/local-home-sdk" />
/// <reference types="@types/node" />
import test from 'ava';
import {
  UdpResponseData,
  createSimpleExecuteCommands,
  extractStubs,
  UdpResponse,
} from '../../src';
import {
  identifyHandler,
  createExecuteHandler,
  createUdpDeviceCommand,
} from './fixtures';

const DEVICE_ID = 'device-id-123';
const DEVICE_PORT = 12345;
const LOCAL_DEVICE_ID = 'local-device-id-123';
const EXECUTE_REQUEST_ID = 'request-id-123';

// Create a valid request for the Execute call.
const expectedCommand: smarthome.DataFlow.UdpRequestData = createUdpDeviceCommand(
  Buffer.from('test-execute-buffer'),
  EXECUTE_REQUEST_ID,
  DEVICE_ID,
  DEVICE_PORT
);

/**
 * Tests that valid Execute request resolves with a 'SUCCESS'.
 */
test('test-valid-execute-request', async t => {
  const app: smarthome.App = new smarthome.App('0.0.1');
  const executeHandler = createExecuteHandler(
    expectedCommand,
    app.getDeviceManager()
  );

  // Registers DEVICE_ID and LOCAL_DEVICE_ID to the Local Home Platform with Identify.
  await app.onIdentify(identifyHandler).onExecute(executeHandler).listen();
  const discoveryBuffer = Buffer.from(
    JSON.stringify({
      localDeviceId: LOCAL_DEVICE_ID,
    })
  );
  await extractStubs(app).mockLocalHomePlatform.triggerIdentify(
    'identify-request-id',
    discoveryBuffer,
    DEVICE_ID
  ),
    LOCAL_DEVICE_ID;

  // Source interactive stubs from the App instance.
  const stubs = extractStubs(app);

  // Create a valid `ExecuteRequestCommands`
  const executeCommands = createSimpleExecuteCommands(
    DEVICE_ID,
    'actions.devices.commands.OnOff',
    {on: true},
    {fooValue: 74, barvalue: true, bazValue: 'sheepdip'}
  );

  // Prepare the `DeviceManagerStub` to expect the command to be sent in `executeHandler`.
  stubs.deviceManagerStub.addExpectedCommand(
    expectedCommand,
    new UdpResponseData(EXECUTE_REQUEST_ID, DEVICE_ID, new UdpResponse())
  );

  // Trigger an Execute intent and confirm a CommandSuccess.
  await t.notThrowsAsync(async () => {
    const executeResponseCommands = await stubs.mockLocalHomePlatform.triggerExecute(
      EXECUTE_REQUEST_ID,
      [executeCommands]
    );
    t.is(executeResponseCommands[0].status, 'SUCCESS');
  });

  // Confirm the expected command was sent.
  t.is(stubs.deviceManagerStub.wasCommandSent(expectedCommand), true);
});
