/*
 * An interactive stub of the smarthome.App class.
 */
/// <reference types="@google/local-home-sdk" />

import {MockLocalHomePlatform} from './mock-local-home-platform';

export const ERROR_LISTEN_WITHOUT_IDENTIFY_HANDLER =
  'Identify handler must be set before listen() can be called';
export const ERROR_LISTEN_WITHOUT_EXECUTE_HANDLER =
  'Execute handler must be set before listen() can be called';
export const ERROR_HANDLERS_NOT_SET =
  'All handlers must be set and listen() must be called before ' +
  'accessing the Platform';

export class AppStub implements smarthome.App {
  private version: string;
  public identifyHandler: smarthome.IntentFlow.IdentifyHandler | undefined;
  public executeHandler: smarthome.IntentFlow.ExecuteHandler | undefined;
  public reachableDevicesHandler:
    | smarthome.IntentFlow.ReachableDevicesHandler
    | undefined;
  private allHandlersSet = false;
  private mockLocalHomePlatform: MockLocalHomePlatform;

  /**
   * Constructs a new AppStub, which implements the smarthome.App interface.
   * Creates a member instance of `MockLocalHomePlatform`.
   * @param version  The app version, in accordance with the smarthome.app type.
   */
  constructor(version: string) {
    this.version = version;
    this.mockLocalHomePlatform = new MockLocalHomePlatform(this);
  }

  /**
   * Returns the `MockLocalHomePlatform` member, if all handlers have been set
   * and `listen()` has been called.
   * Otherwise, throws an `Error`.
   * @returns  The MockLocalHomePlatform member.
   */
  public getLocalHomePlatform(): MockLocalHomePlatform {
    if (this.allHandlersSet) {
      return this.mockLocalHomePlatform;
    } else {
      throw new Error(ERROR_HANDLERS_NOT_SET);
    }
  }

  /**
   * @returns  The `DeviceManager` associated with the platform.
   */
  getDeviceManager(): smarthome.DeviceManager {
    return this.mockLocalHomePlatform.getDeviceManager();
  }

  /**
   * Indicates that all handlers have been set on the app.
   * Will throw an error if either `identifyHandler` or
   * `executeHandler` is missing.
   */
  listen(): Promise<void> {
    if (this.identifyHandler === undefined) {
      throw new Error(ERROR_LISTEN_WITHOUT_IDENTIFY_HANDLER);
    }
    if (this.executeHandler === undefined) {
      throw new Error(ERROR_LISTEN_WITHOUT_EXECUTE_HANDLER);
    }
    this.allHandlersSet = true;
    return Promise.resolve();
  }

  /**
   * Sets the app `executeHandler`.
   * @param executeHandler The `executeHandler` for Execute fulfillment.
   */
  public onExecute(executeHandler: smarthome.IntentFlow.ExecuteHandler): this {
    this.executeHandler = executeHandler;
    return this;
  }

  /**
   * Sets the app `identifyHandler`.
   * @param identifyHandler The `identifyHandler` for Identify fulfillment.
   */
  public onIdentify(
    identifyHandler: smarthome.IntentFlow.IdentifyHandler
  ): this {
    this.identifyHandler = identifyHandler;
    return this;
  }

  /**
   * Sets the app `reachableDevicesHandler`.
   * @param reachableDevicesHandler The `reachableDevicesHandler` for
   *     Reachable Devices fulfillment.
   */
  public onReachableDevices(
    reachableDevicesHandler: smarthome.IntentFlow.ReachableDevicesHandler
  ): this {
    this.reachableDevicesHandler = reachableDevicesHandler;
    return this;
  }
}
