import clc from 'cli-color';

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pushkontak(sock, sender, message, key) {
    try {
        const parts = message.split(" ");

        const templates = `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃      🍁 *${global.name_script}* 🍁
┃
┃ 📢 PUSH KONTAK
┃
┃ 📝 Format:
┃ pushkontak <id_grup> <pesan>
┃
┃ 📌 Contoh:
┃ pushkontak 123456789@g.us Halo semua
╰━━━━━━━━━━━━━━━━━━━━🍁
`;

        if (parts.length < 3) {
            return await sock.sendMessage(sender, { text: templates });
        }

        const idgrub = parts[1];
        const text = parts.slice(2).join(" ");

        if (!idgrub.includes("@g.us")) {
            return await sock.sendMessage(sender, { text: templates });
        }

        if (!text || text.length === 0) {
            return await sock.sendMessage(sender, {
                text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ ❌ Pesan tidak boleh kosong
╰━━━━━━━━━━━━━━━━━━━━🍁
`
            });
        }

        await sock.sendMessage(sender, {
            text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ ⏳ Memproses & mengambil peserta grup...
╰━━━━━━━━━━━━━━━━━━━━🍁
`
        });

        const allParticipant = await getGroupParticipants(sock, idgrub);

        if (!allParticipant || allParticipant.length === 0) {
            return await sock.sendMessage(sender, {
                text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ ❌ Gagal membaca peserta grup
┃ Pastikan bot masih ada di dalam grup
╰━━━━━━━━━━━━━━━━━━━━🍁
`
            });
        }

        const totalMember = allParticipant.length;
        let nomor = 1;

        for (const participant of allParticipant) {
            try {
                console.log(
                    clc.green(`[${nomor}/${totalMember}] Mengirim ke: ${participant.id}`)
                );

                await sock.sendMessage(participant.id, { text });

                await sleep(global.jeda || 3000);
            } catch (sendError) {
                console.error(
                    clc.red(`[ERROR] Gagal ke ${participant.id}:`),
                    sendError
                );
            }
            nomor++;
        }

        return await sock.sendMessage(sender, {
            text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ ✅ Push kontak selesai
┃ 🎯 Total target : ${totalMember}
╰━━━━━━━━━━━━━━━━━━━━🍁
`
        });

    } catch (mainError) {
        console.error(clc.red("[FATAL ERROR]"), mainError);

        return await sock.sendMessage(sender, {
            text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ ❌ Terjadi kesalahan
┃ Silakan coba kembali
╰━━━━━━━━━━━━━━━━━━━━🍁
`
        });
    }
}

async function getGroupParticipants(sock, groupId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        return metadata.participants;
    } catch (error) {
        console.error(clc.red(`[ERROR] Metadata grup gagal:`), error);
        return false;
    }
}

export default pushkontak;