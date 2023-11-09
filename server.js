import express from "express";
import mime from "mime";
import puppeteer from "puppeteer";
import tempfile from "tempfile";
import fs from "node:fs/promises";

(async () => {
    const app = express();
    const port = 5000;

    const options = {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
        headless: "new"
    };
    const browser = await puppeteer.launch(options);

    app.get("/", async ({query}, res) => {
        query = {
            url: null,
            width: 1920,
            height: 1080,
            captureBeyondViewport: false,
            type: "png",
            ...query
        };

        try {
            new URL(query.url);
        } catch (e) {
            res.status(200);
            res.send("Invalid URL");
            return;
        }

        let cookies = [];
        for (let cookieStr of [query.cookie, query.cookies]) {
            if (cookieStr !== undefined) {
                let cookie = JSON.parse(cookieStr);
                if (cookie instanceof Array) {
                    cookies.push(...cookie);
                } else if (cookie?.name !== undefined && cookie?.value !== undefined) {
                    cookies.push(cookie);
                }
            }
        }

        let newBrowser = cookies.length ? await puppeteer.launch(options) : null;
        let page = await (newBrowser ?? browser).newPage();
        let path = tempfile({extension: query.type});

        try {
            await page.setViewport(query);

            if (cookies.length) {
                await page.goto(query.url);
                await page.setCookie(...cookies);
            }

            await page.goto(query.url, {
                waitUntil: "networkidle2"
            });

            await page.screenshot({...query, path});

            res.setHeader("Content-Type", mime.getType(query.type));
            res.sendFile(path);
        } catch (e) {
            console.error(e);
        } finally {
            try {
                if (cookies.length) await page.deleteCookie(...cookies);
                await page.close();
                await newBrowser?.close();
                await fs.unlink(path);
            } catch (e) {
                console.error(e);
            }
        }
    });

    const server = app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });

    async function shutdown (signal) {
        if (signal) console.log(`\nReceived signal ${signal}`);
        console.log('Gracefully closing http server');

        try {
            await browser.close();

            server.close(function (err) {
                if (err) {
                    console.error('There was an error', err.message);
                    process.exit(1);
                } else {
                    console.log('http server closed successfully. Exiting!');
                    process.exit(0);
                }
            })

            // closeAllConnections() is only available from Node v18.02
            if (server.closeAllConnections) server.closeAllConnections();
            else setTimeout(() => process.exit(0), 5000);

        } catch (err) {
            console.error('There was an error', err.message);
            setTimeout(() => process.exit(1), 500);
        }
    }

    process.on("SIGABRT", shutdown);
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
})();
