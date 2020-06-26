/*
 * Stub for App class
 */
/// <reference types="@google/local-home-sdk" />

import { DeviceManagerStub } from './device-manager';
import { MockLocalHomePlatform } from './mock-local-home-platform';
import { MockNetwork } from './mock-radio';

export class AppStub implements smarthome.App {
  private version: string;
  private deviceManager: smarthome.DeviceManager;

  constructor(version: string) {
    this.version = version;
    //  Critical link of App with Local Home Platform
    //  Allows Local Home Platform to access handlers
    MockLocalHomePlatform.getInstance().setApp(this);
    this.initializeDeviceManager();
  }

  private initializeDeviceManager(): void {
    const mockNetwork: MockNetwork = MockLocalHomePlatform.getInstance().getMockNetwork();
    this.deviceManager = new DeviceManagerStub(mockNetwork);
  }

  getDeviceManager(): smarthome.DeviceManager {
    return this.deviceManager;
  }

  //TODO(cjdaly) fill in implementation of the below methods
  listen(): Promise<void> {
    return;
  }
  onExecute(handler: smarthome.IntentFlow.ExecuteHandler): this {
    return;
  }
  onIdentify(handler: smarthome.IntentFlow.IdentifyHandler): this {
    return;
  }
  onReachableDevices(
    handler: smarthome.IntentFlow.ReachableDevicesHandler
  ): this {
    return;
  }
}
