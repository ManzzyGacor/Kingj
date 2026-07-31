export default async function join(sock, sender, messages) {

    const link = messages.split(" ")[1];

    if (!link)
        return sock.sendMessage(sender, {
            text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃      🍁 *${global.name_script}* 🍁
┃
┃ ❌ Masukkan link grup
┃
┃ 📌 Contoh:
┃ autojoin https://chat.whatsapp.com/xxxx
╰━━━━━━━━━━━━━━━━━━━━🍁
`
        });

    try {

        const code = link.split("https://chat.whatsapp.com/")[1];
        await sock.groupAcceptInvite(code);

        sock.sendMessage(sender, {
            text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ ✅ Berhasil join grup
╰━━━━━━━━━━━━━━━━━━━━🍁
`
        });

    } catch {

        sock.sendMessage(sender, {
            text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ ❌ Gagal join grup
╰━━━━━━━━━━━━━━━━━━━━🍁
`
        });

    }
}