import fs from "fs";
import { groupStatus } from "./groupStatus.js";

const dbPath = "./database/autoswgc.json";

function loadDB() {
    return JSON.parse(fs.readFileSync(dbPath));
}

let intervalId = null;

export function startAutoSwgc(sock) {

    if (intervalId) return;

    intervalId = setInterval(async () => {

        const db = loadDB();
        if (!db.active) return;

        const groups = await sock.groupFetchAllParticipating();

        for (const id in groups) {
            await groupStatus(sock, id, { text: db.text });
        }

        console.log("Auto SWGC terkirim");

    }, loadDB().interval * 60000);
}

export function stopAutoSwgc() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}