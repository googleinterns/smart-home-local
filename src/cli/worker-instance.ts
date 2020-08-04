/**
 * Worker thread that runs an instance of a mocked local fulfillment app.
 */
import {parentPort, workerData} from 'worker_threads';
import {smarthomeStub} from '../platform/stub-setup';
import {AppStub} from '../platform/smart-home-app';
import * as fs from 'fs';
import {AppWorker} from './app-worker';
import {READY_FOR_MESSAGE, CHECK_READY} from './commands';

/**
 * Check that this worker thread was started properly
 */
if (parentPort === null) {
  throw new Error("Couldn't start worker thread: parentPort was null");
}

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

const appWorker = new AppWorker(appStubInstance);

/**
 * Recieve a validated command and forward it to the platform instance.
 */
parentPort.on('message', async message => {
  if (message !== CHECK_READY) {
    await appWorker.handleMessage(message);
  }
  parentPort!.postMessage(READY_FOR_MESSAGE);
});
