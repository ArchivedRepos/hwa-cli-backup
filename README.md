# hwa-cli

## Quick Start
1. Install NodeJS and npm
1. Install hwa cli: `npm i -g hwa-cli`
1. Run `hwa convert path/to/chrome/app.crx`
1. Answer prompts
1. The generated `.appx` will appear in the same folder as your chrome package.

## Installation
Make sure you have [NodeJS and npm](https://nodejs.org/en/) installed.

To install, run:
```
npm i -g hwa-cli
```

## Usage
To convert your existing Chrome app, run:
```
hwa convert path/to/chrome/app.crx
```
`hwa-cli` supports the following formats: `.crx`, `.zip`. **Note:** We do not support every single type of Chrome App. If your app is using `Chrome Script`, `Flash`, etc. Please refer to the guidance [here](https://github.com/MicrosoftEdge/WebAppsDocs/blob/master/en-US/win10/StorePublishing.md).

During the conversion process, you will be prompted for an `App Identity`, `Publisher Identity` and `Publisher Display Name`. To retrieve these values, visit the Dashboard in the [Windows Dev Center](https://dev.windows.com/en-us).

Click on `Create a new app` and reserve your App's name:
![Create a new app](https://cloud.githubusercontent.com/assets/3271834/11040454/3780d02a-86c1-11e5-90b1-4775a66f7247.png)

Next, click on `App Identity` in the menu on the left under the `App management` section:
![App Identity](https://cloud.githubusercontent.com/assets/3271834/11040490/640fd870-86c1-11e5-9821-85e411fd747e.png)

You should see the three values you are prompted for listed on the page:
![App Values](https://cloud.githubusercontent.com/assets/3271834/11041022/3050589a-86c4-11e5-9ce5-5985b81c97a3.png)

After plugging in the values and running the tool, you should see an `.appx` file in the current directory.

## Additional Guidance
Additional guidance can be found [here](https://github.com/MicrosoftEdge/WebAppsDocs/blob/master/en-US/win10/StorePublishing.md)
