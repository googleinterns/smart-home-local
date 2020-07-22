import test from 'ava';
import {
  DeviceManagerStub,
  ERROR_UNEXPECTED_COMMAND_REQUEST,
  ERROR_PENDING_REQUEST_MISMATCH,
} from '../../src';
import {createUdpDeviceCommand} from '../example/fixtures';

/**
 * Returns a simple execute request used for testing
 * @param command A command to set in the sample request
 */
function createExecuteRequest(command: string) {
  return {
    requestId: 'test-request-id-1',
    inputs: [
      {
        intent: smarthome.Intents.EXECUTE,
        payload: {
          commands: [
            {
              execution: [
                {
                  command,
                  params: {},
                },
              ],
              devices: [
                {
                  id: 'test-device-id',
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
 * Tests that `markPending()` matches two identical requests
 */
test('device-manager-expected-mark-pending', async t => {
  const deviceManager = new DeviceManagerStub();
  const executeReqeust = createExecuteRequest('action.devices.commands.OnOff');
  const doesNextPendingRequestMatch = deviceManager.doesNextPendingRequestMatch(
    executeReqeust
  );
  deviceManager.markPending(executeReqeust);
  t.is(await doesNextPendingRequestMatch, true);
});

/**
 * Tests that `markPending()` differentiates two different requests
 */
test('device-manager-unexpected-mark-pending', async t => {
  const deviceManager = new DeviceManagerStub();
  const executeReqeust = createExecuteRequest('action.devices.commands.OnOff');
  const differentExecuteRequest = createExecuteRequest(
    'action.devices.commands.OpenClose'
  );
  const doesNextPendingRequestMatch = deviceManager.doesNextPendingRequestMatch(
    executeReqeust
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
 * Tests that an unexpected Execute request throws a `HandlerError`
 */
test('test-unexpected-command-request', async t => {
  const executeRequestId = 'execute-request-id';
  const deviceManager = new DeviceManagerStub();
  const commandRequest = createUdpDeviceCommand(
    Buffer.from('test-execute-buffer'),
    executeRequestId,
    'test-device-id',
    12345
  );
  await t.throwsAsync(
    async () => {
      await deviceManager.send(commandRequest);
    },
    {
      instanceOf: smarthome.IntentFlow.HandlerError,
      message: ERROR_UNEXPECTED_COMMAND_REQUEST,
    }
  );
});
