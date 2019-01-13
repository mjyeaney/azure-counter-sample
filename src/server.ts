import * as dotenv from "dotenv";
import * as express from "express";
import * as bodyParser from "body-parser";
import { AddressInfo } from "net";

import * as lock from "proper-lockfile";
import * as io from "fs";
import { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } from "constants";
import { resolve } from "url";

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
    await lock.lock("./data/counter.lock", { retries: 5 });
    await incrementCounter(); 
    await lock.unlock("./data/counter.lock");
    
    resp.status(200).end();
});

app.post("/incrementUnsafe", async (req: express.Request, resp: express.Response) => {
    await incrementCounter();     
    resp.status(200).end();
});

let incrementCounter = function(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {
            io.readFile("./data/counter.json", (err, rawData) => {
                let counter = JSON.parse(rawData.toString());
                counter.value++;
                console.log(`New counter value is: ${counter.value}`);
                io.writeFile("./data/counter.json", JSON.stringify(counter), (err) => {
                    resolve();
                });
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
    let addrInfo: AddressInfo = server.address() as AddressInfo;
    let host = addrInfo.address;
    var port = addrInfo.port;
    console.log(`Server now listening at http://${host}:${port}`);
});