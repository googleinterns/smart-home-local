# Local Home SDK Command Line Interface

This is a simple command line interface for interacting with a Local Fulfillment App.

It implements the Local Home SDK stubs in `@google/local-home-testing`.

## Usage

To start the command line interface, make sure you have compiled your Local Fulfillment app and have located the entry point of your bundled app. For example, in the [Local Home SDK Sample](https://github.com/actions-on-google/smart-home-local), this would be the `bundle.js` file produced by `webpack`.

Next compile the project:

1. `npm install` to install dependencies.
2. `npm run compile` to compile the tool.

Start the command line interface with:

`npm run cli -- --app ABSOLUTE_APP_PATH`

Where `ABSOLUTE_APP_PATH` is the absolute path to your bundled app. The command line tool will start listening for commands.

### Supported Commands:

---

## **`udp-scan`**

Scans for local devices using UDP discovery. Triggers the `IDENTIFY` handler when a matching device is found.

| Parameter           | Description                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `broadcast_address` | Required. The destination IP address for the UDP broadcast.                                 |
| `broadcast_port`    | Required. The destination port for the UDP discovery broadcast.                             |
| `listen_port`       | Required. The port to listen for the UDP discvery response.                                 |
| `discovery_packet`  | Required. The payload to send in the UDP broadcast.                                         |
| `request_id`        | Optional. An optional request ID for the Identify Request. Defaults to `default-request-id` |
| `device_id`         | Optional. The device ID to include in the Identify Request. Defaults to `default-device-id` |

**Example:**

`udp-scan --broadcast_address localhost --broadcast_port 3320 --listen_port 3311 --discovery_packet ff --device_id local-device-id`

---

## **`trigger-execute`**

Triggers an `EXECUTE` request using the provided parameters.

| Parameter         | Description                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `request_id`      | Optional. The `EXECUTE` request ID. Defaults to `sample-request-id`                                                  |
| `local_device_id` |                                                                                                                      |
| `command`         | Required. The single execute command to include in the `EXECUTE` request.                                            |
| `params`          | Optional. The `params` argument for the single `EXECUTE` command, formatted as a JSON string. Defaults to `{}`.      |
| `customData`      | Optional. The `custom_data` argument for the single `EXECUTE` command, formatted as a JSON string. Defaults to `{}`. |

**Example:**

`trigger-execute --local_device_id local-device-id --command action.devices.commands.ColorAbsolute --params {"color":{"name":"magenta","spectrumRGB":"0xff00ff"}} --custom_data {"channel":1,"leds":8,"control_protocol":"UDP","port":7890}`

## **`simulate-identify`**

Manually sends an `IdentifyRequest` to the `IDENTIFY` handler, using the provided parameters.

| Parameter          | Description                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `request_id`       | Required. The `IDENTIFY` request ID. Defaults to `sample-request-id` |
| `discovery_buffer` | Required. The `IDENTIFY` request discovery buffer.                   |
| `device_id`        | Required. The device ID to provide in the `IDENTIFY` request.        |

## References & Issues

- Questions? Go to [StackOverflow](https://stackoverflow.com/questions/tagged/actions-on-google), [Assistant Developer Community on Reddit](https://www.reddit.com/r/GoogleAssistantDev/) or [Support](https://developers.google.com/assistant/support).
- For bugs, please report an issue on Github.
- Actions on Google [Documentation](https://developers.google.com/assistant)
- Actions on Google [Codelabs](https://codelabs.developers.google.com/?cat=Assistant).

## Make Contributions

Please read and follow the steps in the [CONTRIBUTING.md](CONTRIBUTING.md).

## License

See [LICENSE](LICENSE).

## Disclaimer

**This is not an officially supported Google product.**
