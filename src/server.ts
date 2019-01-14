import * as dotenv from "dotenv";
import * as express from "express";
import * as bodyParser from "body-parser";
import { AddressInfo } from "net";

import * as lock from "proper-lockfile";
import * as io from "fs";

// Init environment
dotenv.config();

// Setup services
const app: express.Application = express();

// Enables parsing of application/x-www-form-urlencoded MIME type
// and JSON
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Check for the PORT env var from the azure host
const port: string | number = process.env.PORT || "8009";

//
// Helper fn to set no-cache headers for API methods
//
const setNoCache = function(res: express.Response){
    res.append("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
};

// 
// Main API methods
//
app.post("/incrementSafe", async (req: express.Request, resp: express.Response) => {
    lock.lock("./data/counter.lock", { retries: 5 })
    .then(() => { return incrementCounter(); })
    .then(() => { resp.status(200).end(); })
    .catch((reason) => {
        resp.status(500).json(JSON.stringify(reason)).end();
    })
    .finally(() => {
        lock.unlock("./data/counter.lock");
    })
});

app.post("/incrementUnsafe", async (req: express.Request, resp: express.Response) => {
    incrementCounter()
    .then(() => { resp.status(200).end(); })
    .catch((reason) => { resp.status(500).json(reason).end(); });
});

let incrementCounter = function(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {
            io.readFile("./data/counter.json", (err, rawData) => {
                try {
                    let counter = JSON.parse(rawData.toString());
                    counter.value++;
                    console.log(`New counter value is: ${counter.value}`);
                    io.writeFile("./data/counter.json", JSON.stringify(counter), (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                } catch (innerErr) {
                    console.log(`ERROR: ${JSON.stringify(innerErr)}`);
                    reject(innerErr);
                }
            });
        } catch (err) {
            console.log(`ERROR: ${JSON.stringify(err)}`);
            reject(err);
        }
    });
};

//
// Init server listener loop
//
const server = app.listen(port, function () {
    console.log(`Server started...`);
});