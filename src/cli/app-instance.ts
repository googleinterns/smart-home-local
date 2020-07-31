/**
 * Worker thread that runs an instance of a mocked local fulfillment app.
 */
import {parentPort, workerData} from 'worker_threads';
import {smarthomeStub, extractStubs} from '../platform/stub-setup';
import {AppStub} from '../platform/smart-home-app';
import {createSimpleExecuteCommands} from '../platform/execute';
import {IdentifyMessage, ExecuteMessage, READY_FLAG} from './command-processor';
import * as fs from 'fs';

/**
 * Override the constructor to capture the AppStub instance.
 */
let appStubInstance: AppStub | undefined = undefined;
class CliAppStub extends AppStub {
  constructor(version: string) {
    super(version);
    appStubInstance = this;
  }
}

/**
 * Inject the stubs into the worker thread context.
 */
smarthomeStub.App = CliAppStub;
(global as any).smarthome = smarthomeStub;

/**
 * Strips the file extension off the filepath and validates it.
 */
const modulePath = workerData.substring(0, workerData.lastIndexOf('.'));
if (!fs.existsSync(workerData)) {
  throw new Error('File at path ' + workerData + ' not found.');
}

// Runs the javascript specified in the app_path command line argument.
require(modulePath);

/**
 * Checks that smarthome.App constructor was called.
 */
if (appStubInstance === undefined) {
  throw new Error(
    'There was no smarthome.App creation detected in the specified module.'
  );
}

// Extracts the MockLocalHomePlatform from the AppStub.
const {mockLocalHomePlatform} = extractStubs(appStubInstance);

if (parentPort !== null) {
  // Signal to the main thread that worker thread has succesfully initialized an app.
  parentPort.postMessage(READY_FLAG);

  /**
   * Recieve a validated command and forward it to the platform instance.
   */
  parentPort.on('message', async intentMessage => {
    if (intentMessage.intentType === 'IDENTIFY') {
      try {
        // Parse as an IdentifyMessage.
        const identifyMessage = intentMessage as IdentifyMessage;

        // Trigger the Identify intent.
        const localDeviceId = await mockLocalHomePlatform.triggerIdentify(
          identifyMessage.requestId,
          Buffer.from(identifyMessage.discoveryBuffer, 'hex'),
          identifyMessage.deviceId
        );

        // Report the registered localDeviceId.
        console.log(
          'IDENTIFY handler triggered. localDeviceId: ' +
            localDeviceId +
            ' was registered to the platform '
        );
      } catch (error) {
        // Log the full error to the console in case handler fails.
        console.log(
          'An error occured when triggering the Identify handler:\n' + error
        );
      }
    } else if (intentMessage.intentType === 'EXECUTE') {
      try {
        // Parse as an ExecuteMessage.
        const executeMessage = intentMessage as ExecuteMessage;
        const executeCommands = createSimpleExecuteCommands(
          executeMessage.localDeviceId,
          executeMessage.executeCommand!,
          executeMessage.params,
          executeMessage.customData
        );

        // Trigger an Execute intent.
        const executeResponse = await mockLocalHomePlatform.triggerExecute(
          executeMessage.requestId,
          [executeCommands]
        );

        // Report the ExecuteResponse if succesful.
        console.log(
          'Execute handler triggered. ExecuteResponse was:\n' +
            executeResponse.toString()
        );
      } catch (error) {
        console.log(
          'An error occured when triggering the Execute handler:\n' + error
        );
      }
    }
  });
}
