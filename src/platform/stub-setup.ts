/*
 * Injects the App stub into the global scope.
 * Bundled HomeApp cannot be loaded until this global is set.
 */
import {AppStub} from './smart-home-app';
import {MockLocalHomePlatform} from './mock-local-home-platform';
import {DeviceManagerStub} from './device-manager';
import {ExecuteStub} from './execute';

export const smarthomeStub: {
  App: typeof smarthome.App;
  Execute: typeof smarthome.Execute;
  Intents: {[key in keyof typeof smarthome.Intents]: string};
  DataFlow: {
    UdpRequestData: typeof smarthome.DataFlow.UdpRequestData;
  };
  IntentFlow: {
    HandlerError: typeof smarthome.IntentFlow.HandlerError;
  };
  Constants: {
    Protocol: {[key in keyof typeof smarthome.Constants.Protocol]: string};
  };
} = {
  App: AppStub,
  Execute: ExecuteStub,
  Intents: {
    EXECUTE: 'action.devices.EXECUTE',
    IDENTIFY: 'action.devices.IDENTIFY',
    REACHABLE_DEVICES: 'action.devices.REACHABLE_DEVICES',
  },
  IntentFlow: {
    HandlerError: class extends Error {
      constructor(requestId: string, errorCode?: string, debugString?: string) {
        super(errorCode);
        this.requestId = requestId;
        this.errorCode = errorCode || '';
        this.debugString = debugString;
      }
      requestId: string;
      errorCode: string;
      debugString?: string;
    },
  },
  DataFlow: {
    UdpRequestData: class {
      data = '';
      requestId = '';
      deviceId = '';
      protocol: smarthome.Constants.Protocol = smarthome.Constants.Protocol.UDP;
      port = 0;
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
};

export interface ExtractedStubs {
  mockLocalHomePlatform: MockLocalHomePlatform;
  deviceManagerStub: DeviceManagerStub;
}

/**
 * Module-level function to source `MockLocalHomePlatform`
 * and `DeviceManagerStub` from an `App`.
 * @param app  The app to promote and extract the stubs from.
 * @returns  The extracted stubs.
 */
export function extractStubs(app: smarthome.App): ExtractedStubs {
  if (app instanceof AppStub) {
    return {
      mockLocalHomePlatform: app.getLocalHomePlatform(),
      deviceManagerStub: app.getLocalHomePlatform().getDeviceManager(),
    };
  }
  throw new Error("Couldn't downcast App to AppStub");
}
