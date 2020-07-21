/*
 * Example tests against a fulfillment's executeHandler
 */
/// <reference types="@google/local-home-sdk" />
/// <reference types="@types/node" />
import test from 'ava';
import {
  extractMockLocalHomePlatform,
  DeviceManagerStub,
  extractDeviceManagerStub,
  MockLocalHomePlatform,
} from '../../src';
import {
  identifyHandler,
  executeHandler,
  createUdpDeviceCommand,
} from './fixtures';
import {UdpResponseData} from '../platform/test-platform-fixtures';

const DEVICE_ID = 'device-id-123';
const DEVICE_PORT = 12345;
const LOCAL_DEVICE_ID = 'local-device-id-123';
const EXECUTE_REQUEST_ID = 'request-id-123';
const app: smarthome.App = new smarthome.App('0.0.1');

function createSimpleExecuteCommands(
  deviceId: string,
  command: string,
  params: object
): smarthome.IntentFlow.ExecuteRequestCommands {
  return {
    devices: [{id: deviceId}],
    execution: [{command, params}],
  };
}

/**
 * Registers DEVICE_ID and LOCAL_DEVICE_ID to the Local Home Platform with Identify
 * Registers the handlers to the platform
 */
test.before(async t => {
  await app.onIdentify(identifyHandler).onExecute(executeHandler).listen();
  const mockLocalHomePlatform = extractMockLocalHomePlatform(app);
  const discoveryBuffer = Buffer.from(
    JSON.stringify({
      localDeviceId: LOCAL_DEVICE_ID,
    })
  );
  await mockLocalHomePlatform.triggerIdentify(
    'identify-request-id',
    discoveryBuffer,
    DEVICE_ID
  ),
    LOCAL_DEVICE_ID;
});

/**
 * Tests that valid Execute request resolves with a 'SUCCESS'
 */
test('test-valid-execute-request', async t => {
  // Create the App and source Device Manager
  const deviceManagerStub: DeviceManagerStub = extractDeviceManagerStub(app);
  const mockLocalHomePlatform: MockLocalHomePlatform = extractMockLocalHomePlatform(
    app
  );

  // Create a valid request for the Execute call
  const expectedCommand: smarthome.DataFlow.UdpRequestData = createUdpDeviceCommand(
    Buffer.from('test-execute-buffer'),
    EXECUTE_REQUEST_ID,
    DEVICE_ID,
    DEVICE_PORT
  );

  // Prepare the stub to expect the command
  deviceManagerStub.addExpectedCommand(
    expectedCommand,
    new UdpResponseData(EXECUTE_REQUEST_ID, DEVICE_ID)
  );

  const executeCommands = createSimpleExecuteCommands(
    DEVICE_ID,
    'actions.devices.commands.OnOff',
    {}
  );
  // Trigger an Execute intent and confirm a CommandSuccess
  await t.notThrowsAsync(async () => {
    const executeResponseCommands = await mockLocalHomePlatform.triggerExecute(
      EXECUTE_REQUEST_ID,
      [executeCommands]
    );
    t.is(executeResponseCommands[0].status, 'SUCCESS');
  });
});
