import {createSimpleExecuteCommands} from '../platform/execute';
import {MockLocalHomePlatform} from '../platform/mock-local-home-platform';
import {AppStub} from '../platform/smart-home-app';
import {extractStubs} from '../platform/stub-setup';
import {RadioHub} from '../radio/radio-hub';
import {ScanMessage, CommandMessage, ExecuteMessage} from './commands';

export type AppWorkerMessageType = 'IDENTIFY' | 'EXECUTE' | 'SYNC';

export class AppWorker {
  private appStub: AppStub;
  private mockLocalHomePlatform: MockLocalHomePlatform;
  private radioHub: RadioHub;

  constructor(appStub: AppStub) {
    this.appStub = appStub;
    this.mockLocalHomePlatform = extractStubs(
      this.appStub
    ).mockLocalHomePlatform;
    this.radioHub = new RadioHub();
  }

  public async handleMessage(workerMessage: CommandMessage): Promise<void> {
    switch (workerMessage.commandType) {
      case 'SCAN':
        try {
          const scanMessage = workerMessage as ScanMessage;
          const discoveryBuffer = await this.radioHub.udpScan(
            scanMessage.scanConfig
          );
          console.log('DONE HANDLE');
          await this.mockLocalHomePlatform.triggerIdentify(
            scanMessage.requestId,
            discoveryBuffer,
            scanMessage.deviceId
          );
        } catch (error) {
          console.log('DONE HANDLE');
          console.error('UDP scan failed:\n' + error);
        }
        break;
      case 'IDENTIFY':
        break;
      case 'EXECUTE':
        try {
          // Parse as an ExecuteMessage.
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
              executeResponse.toString()
          );
        } catch (error) {
          console.error(
            'An error occured when triggering the Execute handler:\n' + error
          );
        }
        break;
    }
    return Promise.resolve();
  }
}
