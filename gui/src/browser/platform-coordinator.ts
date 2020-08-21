import {UDPScanConfig} from '@google/local-home-testing/build/src/radio/dataflow';
import {RadioDeviceManager} from '@google/local-home-testing/build/src/radio/radio-device-manager';
import {
  MockLocalHomePlatform,
  AppStub,
  extractStubs,
  createSimpleExecuteCommands,
} from '@google/local-home-testing';
import {ProxyRadioClient} from './proxy-client';

/**
 * A class to handle radio intialization and interaction between the platform.
 * Wraps platform functions to abstract from static DOM code.
 */
export class PlatformCoordinator {
  private mockLocalHomePlatform: MockLocalHomePlatform | undefined;
  private proxyRadioClient: ProxyRadioClient | undefined;
  private radioDeviceManager: RadioDeviceManager | undefined;

  /**
   * Creates a new `PlatformCoordinator` instance.
   * Handles radio initialization and
   * @param appStubPromise  A promise that resolves to an app stub to capture.
   * @returns  A new `PlatformCoordinator` instance.
   */
  constructor(appStubPromise: Promise<AppStub>) {
    this.initializePlatform(appStubPromise);
  }

  /**
   * Initializes the platform to receive actions.
   * Injects radio dependencies.
   * @param appStubPromise A promise that resolves to an app stub to capture.
   */
  private async initializePlatform(appStubPromise: Promise<AppStub>) {
    console.log('Awaiting smarthome.App constructor...');
    // Wait for an app through this promise
    const appStub = await appStubPromise;
    this.mockLocalHomePlatform = extractStubs(appStub!).mockLocalHomePlatform;
    this.proxyRadioClient = new ProxyRadioClient();
    // Save a `DeviceManager` that is already downcast.
    this.radioDeviceManager = new RadioDeviceManager(this.proxyRadioClient);
    this.mockLocalHomePlatform.setDeviceManager(this.radioDeviceManager);
    console.log('Platform initalized.  Awaiting input.');
  }

  /**
   * Performs a UDP Scan using a `ProxyRadioClient`.
   * @param requestId  The requestId of the request to send to fulfillment on discovery.
   * @param scanConfig  The UDP scan configuration.
   * @param deviceId  The deviceId to pass in the request.
   */
  public async udpScan(
    requestId: string,
    scanConfig: UDPScanConfig,
    deviceId: string
  ): Promise<void> {
    if (this.mockLocalHomePlatform === null) {
      return;
    }
    try {
      const scanRemoteInfo = await this.proxyRadioClient!.udpScan(scanConfig);

      // Trigger the identifyHandler with scan results.
      await this.mockLocalHomePlatform!.triggerIdentify(
        requestId,
        Buffer.from(scanRemoteInfo.scanData, 'hex'),
        deviceId
      );

      // Save association between deviceId and local IP address.
      this.radioDeviceManager!.addDeviceIdToAddress(
        deviceId,
        scanRemoteInfo.rinfo.address
      );
    } catch (error) {
      console.error('UDP scan failed:\n' + error);
    }
  }

  /**
   * Wraps an asyncronous call to the fulfillment's Execute handler.
   * Execute handler and handles errors.
   * @param requestId  The Execute request ID.
   * @param deviceId  The device ID to resolve a destination address from.
   * @param executeCommand  The single execute command to send to the device.
   * @param params  The Execute request params field, as a JSON string.
   * @param customData  The Execute request customData field, as a JSON string.
   */
  public async execute(
    requestId: string,
    deviceId: string,
    executeCommand: string,
    params: Record<string, unknown>,
    customData: Record<string, unknown>
  ): Promise<void> {
    if (this.mockLocalHomePlatform === null) {
      return;
    }
    try {
      const executeCommands = createSimpleExecuteCommands(
        deviceId,
        executeCommand!,
        params,
        customData
      );
      // Trigger an Execute intent.
      const executeResponse = await this.mockLocalHomePlatform!.triggerExecute(
        requestId,
        [executeCommands]
      );
      // Report the ExecuteResponse if succesful.
      console.log(
        `Execute handler triggered. ExecuteResponse was:\n${JSON.stringify(
          executeResponse
        )}`
      );
    } catch (error) {
      console.error(
        `An error occured when triggering the Execute handler:\n${error.toString()}`
      );
    }
  }
}
