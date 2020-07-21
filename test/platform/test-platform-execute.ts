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
  createExecuteHandler,
  createIdentifyHandler,
  createDeviceCommand,
  UdpResponseData,
} from './test-platform-fixtures';

const DEVICE_ID = 'device-id-123';
const DEVICE_PORT = 12345;
const LOCAL_DEVICE_ID = 'local-device-id-123';
const EXECUTE_REQUEST_ID = 'request-id-123';

/**
 * Tests that a valid execute request and handler pair will result in a `SUCCESS`
 */
test('execute-handler-command-success', async t => {
  // Create the App and source Device Manager
  const app: smarthome.App = new smarthome.App('0.0.1');
  const deviceManagerStub: DeviceManagerStub = extractDeviceManagerStub(app);

  // Create a valid request for the Execute call
  const expectedCommand: smarthome.DataFlow.UdpRequestData = createDeviceCommand(
    smarthome.Constants.Protocol.UDP,
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

  // Create an execute handler that sends the expected command
  const executeHandler = createExecuteHandler(
    expectedCommand,
    app.getDeviceManager()
  );

  // Register deviceId with platform
  const identifyHandler = createIdentifyHandler(DEVICE_ID, LOCAL_DEVICE_ID);
  await app.onIdentify(identifyHandler).onExecute(executeHandler).listen();
  const mockLocalHomePlatform: MockLocalHomePlatform = extractMockLocalHomePlatform(
    app
  );
  await mockLocalHomePlatform.triggerIdentify(
    'sample-request-id',
    Buffer.from('sample-buffer')
  );

  // Trigger an Execute intent and confirm a CommandSuccess
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

/**
 * Tests that sending a non-matching command will result in an `ERROR`
 */
test('execute-handler-sends-wrong-buffer', async t => {
  // Create the App and source Device Manager
  const app: smarthome.App = new smarthome.App('0.0.1');
  const deviceManagerStub: DeviceManagerStub = extractDeviceManagerStub(app);

  // Prepare the stub to expect a command
  deviceManagerStub.addExpectedCommand(
    createDeviceCommand(
      smarthome.Constants.Protocol.UDP,
      Buffer.from('test-execute-buffer'),
      EXECUTE_REQUEST_ID,
      DEVICE_ID,
      DEVICE_PORT
    ),
    new UdpResponseData(EXECUTE_REQUEST_ID, DEVICE_ID)
  );

  // Trigger an execute intent with an incorrect buffer
  const executeHandler = createExecuteHandler(
    createDeviceCommand(
      smarthome.Constants.Protocol.UDP,
      Buffer.from('incorrect-buffer'),
      EXECUTE_REQUEST_ID,
      DEVICE_ID,
      DEVICE_PORT
    ),
    app.getDeviceManager()
  );

  // Register deviceId with platform
  const identifyHandler = createIdentifyHandler(DEVICE_ID, LOCAL_DEVICE_ID);
  await app.onIdentify(identifyHandler).onExecute(executeHandler).listen();
  const mockLocalHomePlatform: MockLocalHomePlatform = extractMockLocalHomePlatform(
    app
  );
  await mockLocalHomePlatform.triggerIdentify(
    'sample-request-id',
    Buffer.from('sample-buffer'),
    DEVICE_ID
  );

  // Trigger an Execute intent that fails
  await t.notThrowsAsync(async () => {
    t.is(
      await mockLocalHomePlatform.triggerExecute(
        EXECUTE_REQUEST_ID,
        DEVICE_ID,
        'action.devices.commands.OnOff',
        {}
      ),
      'ERROR'
    );
  });
});
