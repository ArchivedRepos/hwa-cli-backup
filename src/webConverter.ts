import url = require("url");

// Constants
var assetSizes = {
    logoStore: 50,
    logoSmall: 44,
    logoLarge: 150,
    splashScreen: 4096
};
var validIconFormats = [
    'png',
    'image/png'
];

export interface IAppIdentity {
    identityName: string;
    publisherIdentity: string;
    publisherDisplayName: string;
}

export interface IW3CManifest {
    // All defined propterties in the W3C manifest spec
    lang: string;
    name: string;
    short_name: string;
    icons: { sizes: string; src: string }[];
    splash_screens: { sizes: string; src: string }[];
    scope: string;
    start_url: string;
    display: string;
    orientation: string;
    theme_color: string;
    background_color: string;

    // ManifoldJS metadata
    mjs_access_whitelist?: { apiAccess: string; url: string; }[];
}

export interface IChromeOSManifest {
    // Required properties
    app: {
        launch: {
            local_path: string;
            web_url: string;
        };
        urls?: string[];
    };

    manifest_version: number;
    version: string;

    // Optional (non-exhaustive)
    default_locale?: string;
    icons?: { [size: string]: string; };

    // Since the ChromeOSManifest is mostly compatible with the W3CManifest,
    // all W3CManifest properties are optionally defined as well, except 'icons'
    lang?: string;
    name?: string;
    short_name?: string;
    splash_screens?: { sizes: string; src: string }[];
    scope?: string;
    start_url?: string;
    display?: string;
    orientation?: string;
    theme_color?: string;
    background_color?: string;
}

export function chromeToW3CManifest(chromeManifest: IChromeOSManifest, resolveVariable?: (locale: string, varName: string) => string) {
    // Create manifest object
    if (!chromeManifest.app || !chromeManifest.app.launch || (!chromeManifest.app.launch.web_url && !chromeManifest.app.launch.local_path)) {
        throw "Manifest error: No start page found";
    }
    var startUrl = chromeManifest.app.launch.web_url || ("ms-appx-web:///" + chromeManifest.app.launch.local_path);

    var w3cManifest: IW3CManifest = {
        lang: chromeManifest.lang || "en-us",
        name: chromeManifest.name,
        short_name: chromeManifest.short_name || chromeManifest.name,
        icons: [],
        splash_screens: chromeManifest.splash_screens || [],
        scope: chromeManifest.scope || "",
        start_url: startUrl,
        display: chromeManifest.display || "",
        orientation: chromeManifest.orientation || "portrait",
        theme_color: chromeManifest.theme_color || "aliceBlue",
        background_color: chromeManifest.background_color || "gray"
    };

    // Resolve variables
    if (resolveVariable && chromeManifest.default_locale) {
        for (var key in w3cManifest) {
            var value = (<any>w3cManifest)[key];
            if (typeof value === "string" && value.toLowerCase().indexOf("__msg_") === 0) {
                (<any>w3cManifest)[key] = resolveVariable(chromeManifest.default_locale, value.substring(6, value.lastIndexOf("__"))) || value;
            }
        }
    }

    // Extract icons
    for (var size in chromeManifest.icons) {
        w3cManifest.icons.push({
            sizes: size + 'x' + size,
            src: chromeManifest.icons[size]
        });
    }
    
    // Extract app urls
    var extractedUrls: { apiAccess: string; url: string; }[] = [];
    var urls = [startUrl];
    if (chromeManifest.app.urls && chromeManifest.app.urls.length) {
        urls = urls.concat(chromeManifest.app.urls);
    }
    for (var i = 0; i < urls.length; i++) {
        var url = urls[i];
        if (url.indexOf("*://") === 0) {
            // Url starts with '*://', expand this to both 'http://' and 'https://'
            extractedUrls.push({ url: "http" + url.substr(1), apiAccess: "none" });
            extractedUrls.push({ url: "https" + url.substr(1), apiAccess: "none" });
        } else if (url.indexOf("http://") === 0) {
            // Url starts with 'http://', allow both 'http' and 'https'
            extractedUrls.push({ url: "http" + url.substr(4), apiAccess: "none" });
            extractedUrls.push({ url: "https" + url.substr(4), apiAccess: "none" });
        } else {
            extractedUrls.push({ url: url, apiAccess: "none" });
        }
    }
    removeDupesInPlace(extractedUrls, function (a, b) {
        return a.url === b.url;
    });
    w3cManifest.mjs_access_whitelist = (w3cManifest.mjs_access_whitelist || []).concat(extractedUrls);
    
    // Copy any remaining string properties from the Chrome manifest
    for (var prop in chromeManifest) {
        var val = (<any>w3cManifest)[prop];
        if (!val && (typeof val === "string")) {
            console.log("Additional property ingested: '" + prop + "'='" + val + "'");
            (<any>w3cManifest)[prop] = val;
        }
    }

    return w3cManifest;
}

export function w3CToAppxManifest(w3cManifest: IW3CManifest, appxManifestTemplate: string, appIdentity: IAppIdentity, metadataItems: { name: string; value: string }[] = []) {
    if (!w3cManifest.start_url) {
        return;
    }

    var guid = newGuid();
    
    // Find ideal assets
    function matchBest(matchRecord: { sizeDelta: number; src: string; }, asset: { sizes: string; src: string; }, matchSize: number) {
        var delta = +asset.sizes.split("x")[0] - matchSize;
        if ((matchRecord.sizeDelta < 0 && delta > matchRecord.sizeDelta) || (matchRecord.sizeDelta > 0 && delta < matchRecord.sizeDelta)) {
            // Update rules
            // If the recorded delta is negative, then no image has been set yet, or a smaller-than-ideal image is currently recorded
            //   Use the new image if the delta is greater (closer to 0) than before
            // If the recorded delta is positive, then a larger-than-ideal is currently recorded
            //   Use the new image if the delta is smaller (closer to 0) than before
            matchRecord.sizeDelta = delta;
            matchRecord.src = asset.src;
        }
    }
    var logoStore = { sizeDelta: Number.NEGATIVE_INFINITY, src: "" };
    var logoSmall = { sizeDelta: Number.NEGATIVE_INFINITY, src: "" };
    var logoLarge = { sizeDelta: Number.NEGATIVE_INFINITY, src: "" };
    var splashScreen = { sizeDelta: Number.NEGATIVE_INFINITY, src: "" };
    var iconAsSplashScreen = !w3cManifest.splash_screens.length;
    for (var i = 0; i < w3cManifest.icons.length; i++) {
        var iconData = w3cManifest.icons[i];
        matchBest(logoStore, iconData, assetSizes.logoStore);
        matchBest(logoSmall, iconData, assetSizes.logoSmall);
        matchBest(logoLarge, iconData, assetSizes.logoLarge);
        iconAsSplashScreen && matchBest(splashScreen, iconData, assetSizes.splashScreen);
    }
    if (!iconAsSplashScreen) {
        for (var i = 0; i < w3cManifest.splash_screens.length; i++) {
            matchBest(splashScreen, w3cManifest.splash_screens[i], assetSizes.splashScreen);
        }
    }

    console.log("Established Assets:");
    console.log("  Store logo: " + (logoStore.sizeDelta + assetSizes.logoStore) + "px - " + logoStore.src);
    console.log("  Small logo: " + (logoSmall.sizeDelta + assetSizes.logoSmall) + "px - " + logoSmall.src);
    console.log("  Large logo: " + (logoLarge.sizeDelta + assetSizes.logoLarge) + "px - " + logoLarge.src);
    console.log("  Splash screen: " + (splashScreen.sizeDelta + assetSizes.splashScreen) + "px - " + splashScreen.src);
    
    // Update properties
    var appxManifest = appxManifestTemplate.replace(/{IdentityName}/g, appIdentity.identityName)
        .replace(/{Version}/g, "1.0.0.0")
        .replace(/{PublisherIdentity}/g, appIdentity.publisherIdentity)
        .replace(/{PhoneProductId}/g, guid)
        .replace(/{AppDisplayName}/g, w3cManifest.short_name)
        .replace(/{PublisherDisplayName}/g, appIdentity.publisherDisplayName)
        .replace(/{LogoStore}/g, logoStore.src)
        .replace(/{Locale}/g, w3cManifest.lang)
        .replace(/{ApplicationId}/g, sanitizeName(w3cManifest.short_name))
        .replace(/{StartPage}/g, encodeXML(w3cManifest.start_url))
        .replace(/{AppDescription}/g, (<any>w3cManifest)["description"] || w3cManifest.name)
        .replace(/{ThemeColor}/g, w3cManifest.theme_color)
        .replace(/{LogoLarge}/g, logoLarge.src)
        .replace(/{LogoSmall}/g, logoSmall.src)
        .replace(/{SplashScreen}/g, splashScreen.src)
        .replace(/{RotationPreference}/g, w3cManifest.orientation);

    console.log("Start Page: " + w3cManifest.start_url);
    
    // Add additional metadata items
    var indentationChars = '\r\n\t\t';
    var metadataTags = metadataItems.map(entry => {
        console.log("Writing metadata: " + entry.name + "=" + entry.value);
        return '<build:Item Name="' + entry.name + '" Value="' + entry.value + '"/>';
    });
    appxManifest = appxManifest.replace(/{MetadataItems}/g, metadataTags.join(indentationChars));
    
    // Update access rules
    // Set the base access rule using the start_url's base url
    var baseUrlPattern = url.resolve(w3cManifest.start_url, '/');
    var baseApiAccess = 'none';
    if (w3cManifest.scope && w3cManifest.scope.length) {
        // If the scope is defined, the base access rule is defined by the scope
        var parsedScopeUrl = url.parse(w3cManifest.scope);

        if (parsedScopeUrl.host && parsedScopeUrl.protocol) {
            baseUrlPattern = w3cManifest.scope;
        } else {
            baseUrlPattern = url.resolve(baseUrlPattern, w3cManifest.scope);
        }
    }

    // If the base access rule ends with '/*', remove the '*'.
    if (baseUrlPattern.indexOf('/*', baseUrlPattern.length - 2) !== -1) {
        baseUrlPattern = baseUrlPattern.substring(0, baseUrlPattern.length - 1);
    }

    var applicationContentUriRules = '';

    // Add additional access rules
    console.log("Access Rule added: [" + baseApiAccess + "] - " + baseUrlPattern);
    if (w3cManifest.mjs_access_whitelist && w3cManifest.mjs_access_whitelist instanceof Array) {
        for (var j = 0; j < w3cManifest.mjs_access_whitelist.length; j++) {
            var accessUrl = encodeXML(w3cManifest.mjs_access_whitelist[j].url);
            // Ignore the '*' rule 
            if (accessUrl !== '*') {
                // If the access url ends with '/*', remove the '*'.
                if (accessUrl.indexOf('/*', accessUrl.length - 2) !== -1) {
                    accessUrl = accessUrl.substring(0, accessUrl.length - 1);
                }

                var apiAccess = w3cManifest.mjs_access_whitelist[j].apiAccess || 'none';

                if (accessUrl === baseUrlPattern) {
                    baseApiAccess = apiAccess;
                } else {
                    indentationChars = '\r\n        ';
                    applicationContentUriRules += indentationChars + '<uap:Rule Type="include" WindowsRuntimeAccess="' + apiAccess + '" Match="' + accessUrl + '" />';
                    console.log("Access Rule added: [" + apiAccess + "] - " + accessUrl);
                }
            }
        }
    }

    // Added base rule
    applicationContentUriRules = '<uap:Rule Type="include" WindowsRuntimeAccess="' + baseApiAccess + '" Match="' + baseUrlPattern + '" />' + applicationContentUriRules;
    appxManifest = appxManifest.replace(/{ApplicationContentUriRules}/g, applicationContentUriRules);

    return appxManifest;
}

// Helpers
function encodeXML(str: string) {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function getFormatFromIcon(icon: { src: string; type?: string }) {
    return icon.type || (icon.src && icon.src.split('.').pop());
}

function isValidIconFormat(icon: { src: string; type?: string }, validFormats: string[]) {
    if (!validFormats || validFormats.length === 0) {
        return true;
    }

    var iconFormat = getFormatFromIcon(icon);
    for (var i = 0; i < validFormats.length; i++) {
        if (validFormats[i].toLowerCase() === iconFormat) {
            return true;
        }
    }
    return false;
}

function newGuid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function removeDupesInPlace<T>(arr: T[], comparator: (left: T, right: T) => boolean) {
    for (var i = 0; i < arr.length; i++) {
        for (var j = arr.length - 1; j > i; j--) {
            if (comparator(arr[j], arr[i])) {
                arr.splice(j, 1);
            }
        }
    }
    return arr;
}

function sanitizeName(name: string) {
    var sanitizedName = name || "";
  
    // Remove all invalid characters
    sanitizedName = sanitizedName.replace(/[^A-Za-z0-9\.]/g, '');

    var currentLength: number;
    do {
        currentLength = sanitizedName.length;

        // If the name starts with a number, remove the number 
        sanitizedName = sanitizedName.replace(/^[0-9]/, '');

        // If the name starts with a dot, remove the dot
        sanitizedName = sanitizedName.replace(/^\./, '');

        // If there is a number right after a dot, remove the number
        sanitizedName = sanitizedName.replace(/\.[0-9]/g, '.');

        // If there are two consecutive dots, remove one dot
        sanitizedName = sanitizedName.replace(/\.\./g, '.');

        // if the name ends with a dot, remove the dot
        sanitizedName = sanitizedName.replace(/\.$/, '');
    }
    while (currentLength > sanitizedName.length);

    if (sanitizedName.length === 0) {
        sanitizedName = 'MyManifoldJSApp';
    }
    return sanitizedName;
}
