# Command Line Interface

This is a simple command line interface for interacting with a Local Fulfillment app.

# Usage

## To start the command line interface:

Run `npm run cli -- --app_path APP_PATH`, where `APP_PATH` is an absolute path to the entry point of your app (typically `bundle.js` if basing on the [Local Home SDK Sample](https://github.com/actions-on-google/smart-home-local))

## To send an IDENTIFY intent

Run `identify IDENTIFY --request_id REQUEST_ID --discovery_buffer DISCOVERY_BUFFER --device_id DEVICE_ID`

- `REQUEST_ID` is the request id.
- `DISCOVERY_BUFFER` is the discovery buffer, formatted as a hex string.
- `DEVICE_ID` is the device id.

## To send an EXECUTE intent

`execute --request_id REQUEST_ID --local_device_id LOCAL_DEVICE_ID --command COMMAND --params PARAMS --custom_data CUSTOM_DATA`

- `REQUEST_ID` is the request id.
- `LOCAL_DEVICE_ID` is the **local** device id.
- `COMMAND` is the single command to send to the device.
- `PARAMS` is the `params` value to send to the device, formatted as a **JSON string**
- `CUSTOM_DATA` is the `customData` value to send to the deveice, formatted as a **JSON string**

# Examples

Try the following commands against the [Local Home SDK Sample](https://github.com/actions-on-google/smart-home-local):

Registers device with local device id `test-device-1`:
`identify --request_id sample-request --discovery_buffer a56269646d746573742d6465766963652d69656d6f64656c61326668775f72657665302e302e316666775f72657665312e322e33686368616e6e656c7380 --device_id device-id-12`

TODO(cjdaly): add example for EXECUTE
