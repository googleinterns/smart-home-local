/*
 * Injects the App stub into the global scope.
 * Bundled HomeApp cannot be loaded until this global is set.
 */
import {AppStub} from './smart-home-app';
import {MockLocalHomePlatform} from './mock-local-home-platform';

export const smarthomeStub: {
  App: typeof smarthome.App;
  Intents: {[key in keyof typeof smarthome.Intents]: string};
  DataFlow: typeof smarthome.DataFlow;
  Execute: typeof smarthome.Execute;
} = {
  App: AppStub,
  Intents: {
    EXECUTE: 'action.devices.EXECUTE',
    IDENTIFY: 'action.devices.IDENTIFY',
    REACHABLE_DEVICES: 'action.devices.REACHABLE_DEVICES',
  },
  DataFlow: {
    HttpRequestData: class {
      data!: string;
      requestId!: string;
      deviceId!: string;
      protocol: any;
      dataType!: string;
      headers!: string;
      method!: any;
      path!: string;
    },
    TcpRequestData: class {
      data!: string;
      requestId!: string;
      deviceId!: string;
      protocol: any;
      port!: number;
      operation: any;
    },
    UdpRequestData: class {
      data!: string;
      requestId!: string;
      deviceId!: string;
      protocol: any;
      port!: number;
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

// Promotes App to AppStub
export function extractMockLocalHomePlatform(
  app: smarthome.App
): MockLocalHomePlatform {
  if (app instanceof AppStub) {
    return app.getLocalHomePlatform();
  }
  throw new Error("Couldn't downcast App to AppStub");
}
