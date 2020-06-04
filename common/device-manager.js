/**
* DeviceManager Stub For local radio functionality	
* TODO remove comments from local home SDK: just here for reference from sample
**/

// <reference types="@google/local-home-sdk" />

class DeviceManager {
	
  public commands = new Array<smarthome.DataFlow.TcpRequestData>();
  /**
  * `send` is called by app when it needs to communicate with a device.
	* Depending upon the protocol used by the device, the app constructs a
	* [[DataFlow.CommandRequest]] object and passes it as an argument.
	* Returns a promise that resolves to [[DataFlow.CommandSuccess]]. Response
	* may return data, if it was a read request.
	* @param command  Command to communicate with the device.
	* @return  Promise that resolves to [[DataFlow.CommandSuccess]]
	**/
  public send(command: DataFlow.CommandRequest): Promise<DataFlow.CommandSuccess>{
    if (error){
      return Promise.reject(error); 
    }
    this.commmands.push(command);
    return Promise.resolve({
      deviceId,
    });
  }
	/**
	* `markPending` is called by the app when app is done handling an intent,
	* but the actual operation (usually EXECUTE command) is still not done.
	* This enables Google Home to respond back to the user in a timely fashion.
	* This may be useful for somewhat long running operations. Returns a
	* promise.
	* @param request  Original intent request that should be marked pending.
	*/
	markPending(request: IntentRequest): Promise<void>;
	/**
	* `getProxyInfo` is called by app to get information about the hub / bridge
	* controlling this end-device.
	* @param id  Device ID of end device that is being controlled by the hub.
	*/
	getProxyInfo(id: string): ProxyInfo;
}

/**
* Stub function
**/ 

function smarthomeDeviceManagerStub(deviceId: string, error?: any) {
  return new DeviceManager();
}

