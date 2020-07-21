export const ExecuteStub: typeof smarthome.Execute = {
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
};
