import test from 'ava';
import {DeviceManagerStub} from '../../src';

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
  t.is(await doesNextPendingRequestMatch, false);
});
