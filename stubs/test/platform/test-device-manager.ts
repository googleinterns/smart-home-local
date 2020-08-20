/**
 * Internal test for the `DeviceManagerStub` class.
 */
import test from 'ava';
import {
  MockDeviceManager,
  ERROR_UNEXPECTED_COMMAND_REQUEST,
  ERROR_PENDING_REQUEST_MISMATCH,
} from '../../src';
import {UdpResponseData, UdpResponse} from '../../src/radio';
import {createUdpDeviceCommand} from '../example/fixtures';

const EXECUTE_REQUEST_ID = 'execute-request-id';
const DEVICE_ID = 'test-device-id';
const COMMAND_REQUEST = createUdpDeviceCommand(
  Buffer.from('test-execute-buffer'),
  EXECUTE_REQUEST_ID,
  DEVICE_ID,
  12345
);

/**
 * Creates a simple execute request used for testing.
 * @param command  A command to set in the sample request.
 * @param params  The `params` field for the command.
 * @returns a simple execute request with the supplied parameters.
 */
function createExecuteRequest(
  command: string,
  params: Record<string, unknown>
) {
  return {
    requestId: EXECUTE_REQUEST_ID,
    inputs: [
      {
        intent: smarthome.Intents.EXECUTE,
        payload: {
          commands: [
            {
              execution: [
                {
                  command,
                  params,
                },
              ],
              devices: [
                {
                  id: DEVICE_ID,
                },
              ],
            },
          ],
          structureData: {},
        },
      },
    ],
  };
}

/**
 * Tests that `markPending()` matches two identical requests.
 */
test('device-manager-expected-mark-pending', async t => {
  const deviceManager = new MockDeviceManager();
  const executeRequest = createExecuteRequest('action.devices.commands.OnOff', {
    on: true,
  });
  const doesNextPendingRequestMatch = deviceManager.doesNextPendingRequestMatch(
    executeRequest
  );
  deviceManager.markPending(executeRequest);
  t.is(await doesNextPendingRequestMatch, true);
});

/**
 * Tests that `markPending()` differentiates two different requests.
 */
test('device-manager-unexpected-mark-pending', async t => {
  const deviceManager = new MockDeviceManager();
  const executeRequest = createExecuteRequest('action.devices.commands.OnOff', {
    on: true,
  });
  const differentExecuteRequest = createExecuteRequest(
    'action.devices.commands.OnOff',
    {on: true}
  );
  const doesNextPendingRequestMatch = deviceManager.doesNextPendingRequestMatch(
    executeRequest
  );
  deviceManager.markPending(differentExecuteRequest);
  await t.throwsAsync(
    async () => {
      t.is(await doesNextPendingRequestMatch, false);
    },
    {
      instanceOf: Error,
      message: ERROR_PENDING_REQUEST_MISMATCH,
    }
  );
});

/**
 * Tests that an unexpected Execute request throws a `HandlerError`.
 */
test('test-unexpected-command-request', async t => {
  const deviceManager = new MockDeviceManager();
  await t.throwsAsync(
    async () => {
      await deviceManager.send(COMMAND_REQUEST);
    },
    {
      instanceOf: smarthome.IntentFlow.HandlerError,
      message: ERROR_UNEXPECTED_COMMAND_REQUEST,
    }
  );
});

/**
 * Tests that `DeviceManagerStub` keeps track of sent requests
 * and resets them properly.
 */
test('test-sent-requests', async t => {
  const deviceManager = new MockDeviceManager();
  const commandResponse = new UdpResponseData(
    EXECUTE_REQUEST_ID,
    DEVICE_ID,
    new UdpResponse()
  );
  deviceManager.addExpectedCommand(COMMAND_REQUEST, commandResponse);

  // Send an expected command.
  await t.notThrowsAsync(async () => {
    await deviceManager.send(COMMAND_REQUEST);
  });

  // Confirm command was saved.
  t.is(deviceManager.wasCommandSent(COMMAND_REQUEST), true);

  // Confirm command was cleared.
  deviceManager.clearCommandsSent();
  t.is(deviceManager.wasCommandSent(COMMAND_REQUEST), false);
});
