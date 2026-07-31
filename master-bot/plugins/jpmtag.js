import clc from "cli-color";
import fs from "fs";
import { isImageMessage, downloadAndSaveMedia, readWhitelist } from "../lib/utils.js";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

if (global.jpmtagStatus === undefined) {
    global.jpmtagStatus = false;
}

async function getAllGroups(sock) {
    try {
        const groups = await sock.groupFetchAllParticipating();
        return Object.values(groups).map(group => ({
            id: group.id,
            name: group.subject,
            participants: group.participants
        }));
    } catch (error) {
        console.error(clc.red("❌ Gagal mengambil grup:"), error);
        return [];
    }
}

export default async function jpmtag(sock, sender, messages, key, messageEvent) {

    if (global.jpmtagStatus) {
        return sock.sendMessage(sender, {
            text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ ⚠️ JPM TAG sedang berjalan
╰━━━━━━━━━━━━━━━━━━━━🍁
`
        });
    }

    global.jpmtagStatus = true;

    const message = messageEvent.messages?.[0];
    let imagePath = null;

    // Jika ada gambar
    if (isImageMessage(messageEvent)) {
        try {
            const filename = `${sender}.jpeg`;
            const result = await downloadAndSaveMedia(sock, message, filename);
            if (result) imagePath = `./tmp/${filename}`;
        } catch (error) {
            console.error(clc.red("❌ Error download gambar:"), error);
        }
    }

    const parts = messages.trim().split(" ");
    if (parts.length < 2) {
        global.jpmtagStatus = false;
        return sock.sendMessage(sender, {
            text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ 📌 Format:
┃ jpmtag <pesan>
┃
┃ Contoh:
┃ jpmtag Halo gua kallexxz 👋
╰━━━━━━━━━━━━━━━━━━━━🍁
`
        });
    }

    const text = parts.slice(1).join(" ");

    await sock.sendMessage(sender, { react: { text: "🍁", key } });

    const allGroups = await getAllGroups(sock);
    if (!allGroups.length) {
        global.jpmtagStatus = false;
        return sock.sendMessage(sender, { text: "❌ Tidak ada grup ditemukan." });
    }

    const whitelist = readWhitelist();
    const targetGroups = whitelist
        ? allGroups.filter(group => !whitelist.includes(group.id))
        : allGroups;

    if (targetGroups.length === 0) {
        global.jpmtagStatus = false;
        return sock.sendMessage(sender, {
            text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ ⚠️ Semua grup masuk whitelist
╰━━━━━━━━━━━━━━━━━━━━🍁
`
        });
    }

    await sock.sendMessage(sender, {
        text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ 🚀 Mengirim ke ${targetGroups.length} grup
┃ ⏳ Mohon tunggu...
╰━━━━━━━━━━━━━━━━━━━━🍁
`
    });

    let count = 1;

    for (const group of targetGroups) {

        if (!global.jpmtagStatus) {
            return sock.sendMessage(sender, {
                text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ 🛑 JPM TAG dihentikan
╰━━━━━━━━━━━━━━━━━━━━🍁
`
            });
        }

        const participants = Array.isArray(group.participants)
            ? group.participants
            : [];

        const mentions = participants.map(p => p.id);

        console.log(clc.green(`[${count}/${targetGroups.length}] Kirim ke ${group.name}`));

        try {
            await sock.sendMessage(
                group.id,
                imagePath
                    ? { image: fs.readFileSync(imagePath), caption: text, mentions }
                    : { text, mentions }
            );
        } catch (err) {
            console.error(clc.red(`❌ Gagal kirim ke ${group.name}`));
        }

        await sleep(global.jeda || 5000);
        count++;
    }

    global.jpmtagStatus = false;

    return sock.sendMessage(sender, {
        text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ ✅ Pesan berhasil dikirim
┃ 🎯 Total grup : ${targetGroups.length}
╰━━━━━━━━━━━━━━━━━━━━🍁
`
    });
}