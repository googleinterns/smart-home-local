/*
 * Stub for App class
 */
/// <reference types="@google/local-home-sdk" />

import {MockLocalHomePlatform} from './mock-local-home-platform';

export const ERROR_LISTEN_WITHOUT_IDENTIFY_HANDLER: string =
  'Identify handler must be set before listen() can be called';
export const ERROR_LISTEN_WITHOUT_EXECUTE_HANDLER: string =
  'Execute handler must be set before listen() can be called';
export const ERROR_HANDLERS_NOT_SET: string =
  'All handlers must be set and listen() must be called before accessing the Platform';

export class AppStub implements smarthome.App {
  private version: string;
  public identifyHandler: smarthome.IntentFlow.IdentifyHandler | undefined;
  public executeHandler: smarthome.IntentFlow.ExecuteHandler | undefined;
  public reachableDevicesHandler:
    | smarthome.IntentFlow.ReachableDevicesHandler
    | undefined;
  private allHandlersSet: boolean = false;
  private mockLocalHomePlatform: MockLocalHomePlatform;

  /**
   * Constructs a new AppStub, which implements the smarthome.App interface
   * Creates a member instance of `MockLocalHomePlatform`
   * @param version  The app version, in accordance with the smarthome.app type
   */
  constructor(version: string) {
    this.version = version;
    this.mockLocalHomePlatform = new MockLocalHomePlatform(this);
  }

  public getLocalHomePlatform(): MockLocalHomePlatform {
    if (this.allHandlersSet) {
      return this.mockLocalHomePlatform;
    } else {
      throw new Error(ERROR_HANDLERS_NOT_SET);
    }
  }

  getDeviceManager(): smarthome.DeviceManager {
    return this.mockLocalHomePlatform.getDeviceManager();
  }

  listen(): Promise<void> {
    if (this.identifyHandler === undefined) {
      this.allHandlersSet = false;
      throw new Error(ERROR_LISTEN_WITHOUT_IDENTIFY_HANDLER);
    }
    if (this.executeHandler === undefined) {
      this.allHandlersSet = false;
      throw new Error(ERROR_LISTEN_WITHOUT_EXECUTE_HANDLER);
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
