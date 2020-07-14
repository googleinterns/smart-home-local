/*
 * Stub for App class
 */
/// <reference types="@google/local-home-sdk" />

import {
  MockLocalHomePlatform,
  ERROR_UNDEFINED_APP,
} from './mock-local-home-platform';

export const ERROR_UNDEFINED_IDENTIFYHANDLER: string =
  'Identify handler must be set before listen() can be called';
export const ERROR_UNDEFINED_EXECUTEHANDLER: string =
  'Execute handler must be set before listen() can be called';

export class AppStub implements smarthome.App {
  private version: string;
  public identifyHandler: smarthome.IntentFlow.IdentifyHandler | undefined;
  public executeHandler: smarthome.IntentFlow.ExecuteHandler | undefined;
  public reachableDevicesHandler:
    | smarthome.IntentFlow.ReachableDevicesHandler
    | undefined;
  private allHandlersSet: boolean = false;

  constructor(version: string) {
    this.version = version;
    //  Allows Local Home Platform to access handlers
    MockLocalHomePlatform.getInstance().setApp(this);
  }

  isAllHandlersSet(): boolean {
    return this.allHandlersSet;
  }

  getDeviceManager(): smarthome.DeviceManager {
    return MockLocalHomePlatform.getInstance().getDeviceManager();
  }

  listen(): Promise<void> {
    if (this.identifyHandler === undefined) {
      this.allHandlersSet = false;
      return Promise.reject(new Error(ERROR_UNDEFINED_IDENTIFYHANDLER));
    }
    if (this.executeHandler === undefined) {
      this.allHandlersSet = false;
      return Promise.reject(new Error(ERROR_UNDEFINED_EXECUTEHANDLER));
    }
    this.allHandlersSet = true;
    return Promise.resolve();
  }

  public onExecute(executeHandler: smarthome.IntentFlow.ExecuteHandler): this {
    this.executeHandler = executeHandler;
    return this;
  }

  public onIdentify(
    identifyHandler: smarthome.IntentFlow.IdentifyHandler
  ): this {
    this.identifyHandler = identifyHandler;
    return this;
  }

  public onReachableDevices(
    reachableDevicesHandler: smarthome.IntentFlow.ReachableDevicesHandler
  ): this {
    this.reachableDevicesHandler = reachableDevicesHandler;
    return this;
  }
}
