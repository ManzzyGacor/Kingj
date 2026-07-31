export default async function (sock, sender, command) {

    try {

        let args = command.split(" ").slice(1)

        if (args.length === 0) {
            return sock.sendMessage(sender, {
                text: `
╭━━━━━━━━━━━━━━━━━━━🍁
┃ ${global.name_script}
┃
┃ ❌ Kirim link grup!
╰━━━━━━━━━━━━━━━━━━━🍁
`
            })
        }

        const text = args.join(" ")

        const links = text.match(/https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{20,24}/g)

        if (!links) {
            return sock.sendMessage(sender, {
                text: "❌ Tidak ada link valid ditemukan!"
            })
        }

        global.pendingJoin = global.pendingJoin || {}
        global.pendingJoin[sender] = links

        await sock.sendMessage(sender, {
            text: `
╭━━━━━━━━━━━━━━━━━━━🍁
┃ 🔎 SCAN SELESAI
┃
┃ 📦 Total Link : ${links.length}
┃
┃ Ketik *.gasjoin*
╰━━━━━━━━━━━━━━━━━━━🍁
`
        })

    } catch (err) {
        console.log("ERROR JOINALL:", err)
    }
}