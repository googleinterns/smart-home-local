# Local Home SDK Stubs

This is a library of stubs for the `Local Home SDK` that simulate the `Local Home Platform`

## Injecting the stubs

Importing the default module of this library will implicitly load `Local Home SDK` stubs in the global scope and enable usage of the library. This will implement the interfaces in `smarthome` namespace and enable you to run your local fulfillment app locally.

## Extracting the Stubs

There are two main stubs for platform interaction: `MockLocalHomePlatform` and `MockDeviceManager`.
When the `smarthome.App` constructor is called, a `smarthome.App` stub instance is created in memory and creates instances of these stubs.

To access these stubs and their interfaces, you will need to use the module-level function `extractStubs()` and pass in your app stub.

See `JSDocs` for `MockLocalHomePlatform` and `MockDeviceManager` usage. An example of this is located in the `test/example` directory.

## Automatic testing

Automatic testing can be conducted using the stubs in this library. Example tests are included in the `test/example/` directory.

## Manual testing

To use true UDP, TCP, and HTTP with the stubs, you can use the [command line interface](../cli/), which runs in Node.js or the [graphical user interface](../gui/), which runs in a browser. Please see the respective `README`s for configuration and usage.

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
