import fs from 'fs';
import clc from 'cli-color';
import { groupStatus } from '../lib/groupStatus.js';
import { isImageMessage, downloadAndSaveMedia } from '../lib/utils.js';

if (global.swgcStop === undefined) {
    global.swgcStop = false;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAllGroups(sock) {
    const groups = await sock.groupFetchAllParticipating();
    return Object.values(groups);
}

export default async function swgc(sock, sender, messages, key, messageEvent) {

    const message = messageEvent.messages?.[0];
    let imagePath = null;

    if (isImageMessage(messageEvent)) {
        const filename = `${sender}_swgc.jpeg`;
        const result = await downloadAndSaveMedia(sock, message, filename);
        if (result) imagePath = `./tmp/${filename}`;
    }

    const parts = messages.trim().split(' ');
    if (parts.length < 2 && !imagePath) {
        return sock.sendMessage(sender, {
            text:
`🍁 *SWGC - Status Grup*

Cara pakai:
.swgc <pesan>

Atau kirim gambar + caption:
.swgc caption`
        });
    }

    const text = parts.slice(1).join(' ');
    const groups = await getAllGroups(sock);

    await sock.sendMessage(sender, {
        text:
`🍁 *SWGC DIMULAI*

📢 Total Grup : ${groups.length}
⏳ Delay       : ${global.jeda || 5000} ms

Mohon tunggu sampai selesai...`
    });

    let sukses = 0;

    for (const group of groups) {

    // cek stop sebelum kirim
    if (global.swgcStop) {
        global.swgcStop = false;
        return;
    }

    const payload = imagePath
        ? { image: fs.readFileSync(imagePath), caption: text }
        : { text };

    const result = await groupStatus(sock, group.id, payload);

    if (result) {
        sukses++;
        console.log(clc.green("SWGC terkirim ke:"), group.subject);
    }

    // delay responsif (cek tiap 1 detik)
    let delay = global.jeda || 5000;
    let interval = 1000;

    for (let i = 0; i < delay; i += interval) {

        if (global.swgcStop) {
            global.swgcStop = false;
            return;
        }

        await sleep(interval);
    }
}

    sock.sendMessage(sender, {
        text:
`🍁 *SWGC SELESAI*

✅ Berhasil terkirim ke ${sukses} grup.
`
    });
}