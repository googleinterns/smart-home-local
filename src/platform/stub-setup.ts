/*
 * Injects the App stub into the global scope.
 * Bundled HomeApp cannot be loaded until this global is set.
 */
import {AppStub} from './smart-home-app';
import {MockLocalHomePlatform} from './mock-local-home-platform';
import {DeviceManagerStub} from './device-manager';

export const smarthomeStub: {
  App: typeof smarthome.App;
  Intents: {[key in keyof typeof smarthome.Intents]: string};
  DataFlow: {
    UdpRequestData: typeof smarthome.DataFlow.UdpRequestData;
  };
  Constants: {
    Protocol: {[key in keyof typeof smarthome.Constants.Protocol]: string};
  };
  Execute: typeof smarthome.Execute;
} = {
  App: AppStub,
  Intents: {
    EXECUTE: 'action.devices.EXECUTE',
    IDENTIFY: 'action.devices.IDENTIFY',
    REACHABLE_DEVICES: 'action.devices.REACHABLE_DEVICES',
  },
  DataFlow: {
    UdpRequestData: class {
      data!: string;
      requestId!: string;
      deviceId!: string;
      protocol: smarthome.Constants.Protocol = smarthome.Constants.Protocol.UDP;
      port!: number;
    },
  },
  Constants: {
    Protocol: {
      BLE: 'BLE',
      HTTP: 'HTTP',
      TCP: 'TCP',
      UDP: 'UDP',
      BLE_MESH: 'BLE_MESH',
    },
  },
  Execute: {
    Response: {
      Builder: class {
        private requestId: string = '';
        private commands: smarthome.IntentFlow.ExecuteResponseCommands[] = [];
        public setRequestId(requestId: string): this {
          this.requestId = requestId;
          return this;
        }
        public setSuccessState(deviceId: string, state: unknown): this {
          this.commands.push({
            ids: [deviceId],
            status: 'SUCCESS',
            states: state,
          });
          return this;
        }
        public setErrorState(
          deviceId: string,
          errorCode: smarthome.IntentFlow.ExecuteErrors
        ): this {
          this.commands.push({
            ids: [deviceId],
            status: 'ERROR',
            errorCode,
          });
          return this;
        }
        public build() {
          return {
            requestId: this.requestId,
            payload: {
              commands: this.commands,
            },
          };
        }
      },
    },
  },
};

/**
 * Module-level function to source a `MockLocalHomePlatform` from an `App`.
 * @param app  The app to promote and extract the `MockLocalHomePlatform` from.
 * @returns  The `MockLocalHomePlatform` member.
 */
export function extractMockLocalHomePlatform(
  app: smarthome.App
): MockLocalHomePlatform {
  if (app instanceof AppStub) {
    return app.getLocalHomePlatform();
  }
  throw new Error("Couldn't downcast App to AppStub");
}
/**
 * Module-level function to source a `DeviceManagerStub` from an `App`.
 * @param app  The app to promote and extract the `DeviceManagerStub` from.
 * @returns  The `DeviceManagerStub` member.
 */
export function extractDeviceManagerStub(
  app: smarthome.App
): DeviceManagerStub {
  const deviceManager = app.getDeviceManager();
  if (deviceManager instanceof DeviceManagerStub) {
    return deviceManager;
  }
  throw new Error('DeviceManagerStub not found');
}
