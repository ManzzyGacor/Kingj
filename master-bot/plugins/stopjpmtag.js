export default async function stopjpmtag(sock, sender) {

    global.jpmtagStatus = false;

    await sock.sendMessage(sender, {
        text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ 🛑 JPM TAG berhasil dihentikan
╰━━━━━━━━━━━━━━━━━━━━🍁
`
    });
}