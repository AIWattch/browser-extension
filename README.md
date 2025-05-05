# AI Wattch
A Chrome extension that tracks your emissions while using ChatGPT.
Here's a short [demo video](https://www.youtube.com/watch?v=594hVECkKlc)

## Pre-requisite browser configuration

- Open Chrome and navigate to `chrome://extensions`
- In the top right, toggle **Developer mode** on
- You will now be able to install extensions by clicking the **Load unpacked** button in the top left

## Download 

### Create a build from source

Ensure you have Node.js and npm installed, [click here for instructions to download](https://nodejs.org/en/download)

```
git clone git@github.com:AIWattch/browser-extension.git
cd browser-extension/
npm i
npm run build
```

### Release build

Alternatively, you can use the latest pre-built version of the extension by downloading it from the right side of this page under the **Releases** header

## Installation

### Load the extension in Chrome

- Click the **Load unpacked** button, find the `browser-extension/dist` folder and click Open

## Contributing

We welcome contributions! Here's how you can help:

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Before submitting:
- Test your changes
- Update documentation if needed
- Follow our coding standards (TypeScript)
- One feature per PR

For major changes:
- Open an issue first to discuss what you'd like to change
- Mention any dependencies or breaking changes

Need help? Check [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines or open an issue.

## Running Tests

Unit tests are set up using [Vitest](https://vitest.dev/). To run the tests, use the following command in your terminal:

```bash
npm test
```

This will execute all test files in the `src` directory that match the `*.test.js` pattern.
