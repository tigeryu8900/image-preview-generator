import express from "express";
import mime from "mime";
import puppeteer from "puppeteer";
import tempfile from "tempfile";
import fs from "node:fs/promises";

(async () => {
    const app = express();
    const port = 5000;

    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
        headless: "new"
    });

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

        let page = await browser.newPage();
        let path = tempfile({extension: query.type});
        try {
            await page.setViewport(query);

            if (query.cookie !== undefined) {
                let cookie = JSON.parse(query.cookie);
                if (cookie instanceof Array) {
                    await page.goto(query.url);
                    await page.setCookie(...cookie);
                } else if (cookie?.name !== undefined && cookie?.value !== undefined) {
                    await page.goto(query.url);
                    await page.setCookie(cookie);
                }
            }
            if (query.cookies !== undefined) {
                let cookies = JSON.parse(query.cookies);
                if (cookies instanceof Array) {
                    await page.goto(query.url);
                    await page.setCookie(...cookies);
                } else if (cookies?.name !== undefined && cookies?.value !== undefined) {
                    await page.goto(query.url);
                    await page.setCookie(cookies);
                }
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
                await page.close();
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
