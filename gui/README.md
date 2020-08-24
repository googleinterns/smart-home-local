# Local Home SDK Browser Testing Environment

This is a Local Home SDK implementation that runs in a browser. It has been tested in Chrome.

# Setup

Make sure you have compiled your Local Fulfillment app and have located the entry point of your bundled app. For example, in the [Local Home SDK Sample](https://github.com/actions-on-google/smart-home-local), this would be the `bundle.js` file produced by `webpack`.

### 1. Compile the app:

- `npm run install`
- `npm run build`

### 2. Start the radio proxy server

- `npm run proxy` to start the node proxy server.

### 3. Start the browser client

- **In a separate shell instance**, `npm run host` to serve the client app.
- Open `localhost:5000` in a browser that supports JavaScript.

You should see `Awaiting smarthome.App constructor` in the console log.

### 4. Load your Local Fulfillment app

Under the `Load App Bundle` label, select your bundled Local Fulfillment app. This will run your bundled app and link it with the Local Home SDK stubs. You should see a message indicating that the platform has been initialized.
You should also see a `Connection established with proxy server` message, indicating the browser app has successfully opened a connection to your radio proxy server. If not, double check that you're still running command from step 1 on another shell. You are now ready to send commands

# Functionality

## **`UDP Scan`**

Scans for local devices using UDP discovery. Triggers the `IDENTIFY` handler when a matching device is found.

| Parameter         | Description                                                                           |
| ----------------- | ------------------------------------------------------------------------------------- |
| Request ID        | A request ID for the `IDENTIFY` Request to send when a matching device is discovered. |
| Device ID         | The device ID to include in the `IDENTIFY` Request.                                   |
| Broadcast Address | The destination IP address for the UDP broadcast.                                     |
| Broadcast Port    | The destination port for the UDP discovery broadcast.                                 |
| Listen Port       | The port to listen for the UDP discovery response.                                    |
| Discovery Packet  | The payload to send in the UDP broadcast                                              |

---

## **`Trigger Execute Request`**

Triggers an `EXECUTE` request using the provided parameters.

| Parameter       | Description                                                                              |
| --------------- | ---------------------------------------------------------------------------------------- |
| Request ID      | The `EXECUTE` request ID.                                                                |
| Device ID       | The device ID of the destination device. This is used to resolve a local radio path.     |
| Execute Command | The single execute command to include in the `EXECUTE` request.                          |
| params JSON     | The `params` argument for the single `EXECUTE` command, formatted as a JSON string.      |
| customData JSON | The `custom_data` argument for the single `EXECUTE` command, formatted as a JSON string. |

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
