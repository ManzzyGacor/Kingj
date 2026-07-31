import fs from "fs";

const dbPath = "./database/swgc.json";

function loadDB() {
    if (!fs.existsSync(dbPath)) return {};
    return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export function startAutoDelete(sock) {

    setInterval(async () => {

        const db = loadDB();
        const now = Date.now();

        for (const jid in db) {

            if (now >= db[jid].expired) {

                try {

                    await sock.relayMessage(
                        jid,
                        {
                            protocolMessage: {
                                key: {
                                    remoteJid: jid,
                                    id: db[jid].id
                                },
                                type: 0
                            }
                        },
                        {}
                    );

                    delete db[jid];
                    saveDB(db);

                } catch {}
            }
        }

    }, 60000);
}