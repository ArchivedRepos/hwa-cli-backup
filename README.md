# hwa-cli

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
`hwa-cli` supports the following formats: `.crx`, `.zip`.

During the conversion process, you will be prompted for an `App Identity` and `Publisher Identity`. To retrieve these values, visit the Dashboard in the [Windows Dev Center](https://dev.windows.com/en-us).

Click on `Create a new app` and reserve your App's name:
![Create a new app](https://cloud.githubusercontent.com/assets/3271834/11040454/3780d02a-86c1-11e5-90b1-4775a66f7247.png)

Next, click on `App Identity` in the menu on the left under the `App management` section:
![App Identity](https://cloud.githubusercontent.com/assets/3271834/11040490/640fd870-86c1-11e5-9821-85e411fd747e.png)

After plugging in the values adn running the tool, you should see an `.appx` file in the current directory.

##Submission
When you are ready, you can submit your app in the 



## Additional Guidance
Additional guidance can be found [here](https://github.com/MicrosoftEdge/WebAppsDocs/blob/master/en-US/win10/StorePublishing.md)
