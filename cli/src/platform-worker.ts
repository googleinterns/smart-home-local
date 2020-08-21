import {
  createSimpleExecuteCommands,
  extractStubs,
  AppStub,
  MockLocalHomePlatform,
} from '@google/local-home-testing';
import {
  RadioDeviceManager,
  RadioController,
  NodeRadioController,
} from '@google/local-home-testing/build/src/radio/index';
import {
  ScanMessage,
  CommandMessage,
  ExecuteMessage,
  IdentifyMessage,
} from './commands';

/**
 * Class to recieve `CommandMessage`s and forward them to
 * the respective platform components.
 */
export class PlatformWorker {
  private appStub: AppStub;
  private mockLocalHomePlatform: MockLocalHomePlatform;
  private radioDeviceManager: RadioDeviceManager;
  private radioController: RadioController;

  /**
   * Creates a new PlatformWorker.
   * Initializes required platform components.
   * @param appStub  The `App` instance to control.
   * @returns  A new PlatformWorker instance.
   */
  constructor(appStub: AppStub) {
    this.appStub = appStub;
    this.mockLocalHomePlatform = extractStubs(
      this.appStub
    ).mockLocalHomePlatform;
    // Save access to radio controls.
    this.radioController = new NodeRadioController();
    // Create and save a typed `RadioDeviceManager`.
    this.radioDeviceManager = new RadioDeviceManager(this.radioController);
    // Inject radio functionality in the platform.
    this.mockLocalHomePlatform.setDeviceManager(this.radioDeviceManager);
  }

  /**
   * Takes a formed `CommandMessage` and takes corresponding action on the platform.
   * @param workerMessage  A `CommandMessage` to process.
   */
  public async handleMessage(workerMessage: CommandMessage): Promise<void> {
    switch (workerMessage.commandType) {
      /**
       * Handle a UDP Scan command.
       */
      case 'SCAN':
        try {
          const scanMessage = workerMessage as ScanMessage;
          // Perform a UDP scan with given config.
          const scanRemoteInfo = await this.radioController.udpScan(
            scanMessage.scanConfig
          );
          // Trigger the identifyHandler with scan results.
          await this.mockLocalHomePlatform.triggerIdentify(
            scanMessage.requestId,
            Buffer.from(scanRemoteInfo.scanData, 'hex'),
            scanMessage.deviceId
          );
          // Save association between deviceId and local IP address.
          this.radioDeviceManager.addDeviceIdToAddress(
            scanMessage.deviceId,
            scanRemoteInfo.rinfo.address
          );
        } catch (error) {
          console.error('UDP scan failed:\n' + error);
        }
        break;
      /**
       * Handle manual Identify trigger command.
       */
      case 'IDENTIFY':
        try {
          const identifyMessage = workerMessage as IdentifyMessage;
          // Forward parameters to `triggerIdentify`.
          await this.mockLocalHomePlatform.triggerIdentify(
            identifyMessage.requestId,
            Buffer.from(identifyMessage.discoveryBuffer, 'hex'),
            identifyMessage.deviceId
          );
        } catch (error) {
          console.error(
            'An Error occured while triggering the identifyHandler: ' + error
          );
        }
        break;
      /**
       * Handle an Execute command.
       */
      case 'EXECUTE':
        try {
          const executeMessage = workerMessage as ExecuteMessage;
          const executeCommands = createSimpleExecuteCommands(
            executeMessage.localDeviceId,
            executeMessage.executeCommand!,
            executeMessage.params,
            executeMessage.customData
          );

          // Trigger an Execute intent.
          const executeResponse = await this.mockLocalHomePlatform.triggerExecute(
            executeMessage.requestId,
            [executeCommands]
          );

          // Report the ExecuteResponse if succesful.
          console.log(
            'Execute handler triggered. ExecuteResponse was:\n' +
              JSON.stringify(executeResponse)
          );
        } catch (error) {
          console.error(
            'An error occured when triggering the Execute handler:\n' +
              error.toString()
          );
        }
        break;
    }
    return Promise.resolve();
  }
}
