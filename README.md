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

## Guide for migrating your Hosted Web App
### Things you should know
* Application Content URI Rules
* Flash
* Image assets
* Capabilities
* File downloads

### Application Content URI Rules
Application Content URI Rules (ACURs) or Content URIs define the scope of your Hosted Web App through a URL allow list in your app package manifest. In order to control the communication to and from remote content, you must define which URLs are included in, and/or excluded from, this list. If a user clicks a URL that is not explicitly included, Windows will open the target path in the default browser. With ACURs, you are also able to grant a URL access to [Universal Windows APIs](https://msdn.microsoft.com/en-us/library/windows/apps/br211377.aspx).

At the very minimum, your rules should include your app’s start page. The conversion tool will automatically create a set of ACURs for you, based on your start page and its domain. However, if there are any programmatic redirects, whether on the server or on the client, those destinations will need to be added to the allow list. 

Note: ACURs only apply to page navigation. Images, JavaScript libraries, and other similar assets are not affected by these restrictions.

Many apps use third-party sites for their login flows, e.g. Facebook and Google. The conversion tool will automatically create a set of ACURs for you, based on the most popular sites. If your method of authentication is not included in that list, and it’s a redirect flow, you will need to add its path(s) as an ACUR. You can also consider using a [web authentication broker](http://microsoftedge.github.io/WebAppsDocs/en-US/win10/HWAfeatures.htm#web-authentication-broker).

### Flash
Flash is not allowed in Windows 10 apps. You will need to make sure your app experience is not affected by its absence.

For ads, you will need to make sure your ad provider has an HTML5 option. You can check out [Bing Ads](https://bingads.microsoft.com/) and [Ads in Apps](http://adsinapps.microsoft.com/).

YouTube videos should still work, as they now [default to HTML5 <video>](http://youtube-eng.blogspot.com/2015/01/youtube-now-defaults-to-html5_27.html), so long as you are using the [<iframe> embed method](https://developers.google.com/youtube/iframe_api_reference). If your app still uses the Flash API, you will need to switch to the aforementioned style of embed.

### Image assets
The Chrome web store already [requires](https://developer.chrome.com/webstore/images) a 128x128 app icon image in your app package. For Windows 10 apps, you must supply 44x44, 50x50, 150x150, and 600x350 app icon images, at the very minimum. The conversion tool will automatically create these images for you, based on the 128x128 image. For a richer, more polished app experience, we highly recommend creating your own image files. Here are some [guidelines](https://msdn.microsoft.com/en-us/library/windows/apps/mt412102.aspx) for tile and icon assets.

### Capabilities
There are four categories of capabilities: [general-use](https://msdn.microsoft.com/en-us/library/windows/apps/Mt270968.aspx#general-use_capabilities), [device](https://msdn.microsoft.com/en-us/library/windows/apps/Mt270968.aspx#device_capabilities), [special-use and restricted](https://msdn.microsoft.com/en-us/library/windows/apps/Mt270968.aspx#special_and_restricted_capabilities). Popular examples are location, microphone, and webcam. You will need to explicitly declare these capabilities in your package manifest for your app to use them.

Note: Users are notified of all the capabilities that an app declares. It would be prudent to not declare any capabilities that your app does not need.

### File downloads
Traditional file downloads, like you see in the browser, are not currently supported.
