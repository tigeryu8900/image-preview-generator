# image-preview-generator

This is a node server that generates previews from a url.

## Usage

Screenshot of Google:

![image](https://image-preview-generator.dokku-10.cs.ucsb.edu/?url=https://www.google.com)

```text
http://localhost:5000/?url=https://www.google.com
https://image-preview-generator.dokku-10.cs.ucsb.edu/?url=https://www.google.com
```

### Parameters

Other than `url`, supported parameters include all that's supported by Puppeteer's
[`Viewport`](https://pptr.dev/api/puppeteer.viewport) and
[`ScreenshotOptions`](https://pptr.dev/api/puppeteer.screenshotoptions).

Other than these three parameters, all parameters default to Puppeteer's default parameters:

| parameter               | default value |
|-------------------------|---------------|
| `width`                 | `1920`        |
| `height`                | `1080`        |
| `captureBeyondViewport` | `false`       |
