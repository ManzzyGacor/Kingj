export default async function (sock, sender) {

    try {

        if (!global.pendingJoin || !global.pendingJoin[sender]) {
            return sock.sendMessage(sender, {
                text: "❌ Tidak ada data join tersimpan."
            })
        }

        const links = global.pendingJoin[sender]
        delete global.pendingJoin[sender]

        await sock.sendMessage(sender, {
            text: `
╭━━━━━━━━━━━━━━━━━━━🍁
┃ 🚀 JOIN DIMULAI
┃
┃ 📦 Total Grup : ${links.length}
┃ ⏳ Delay Auto : ${global.jeda / 1000} detik
╰━━━━━━━━━━━━━━━━━━━🍁
`
        })

        let sukses = 0
        let gagal = 0

        for (let link of links) {
            try {
                const code = link.split("chat.whatsapp.com/")[1]
                await sock.groupAcceptInvite(code)
                sukses++
            } catch {
                gagal++
            }

            await new Promise(resolve => setTimeout(resolve, global.jeda))
        }

        await sock.sendMessage(sender, {
            text: `
╭━━━━━━━━━━━━━━━━━━━🍁
┃ ✅ JOIN SELESAI
┃
┃ ✔️ ${sukses}
┃ ❌ ${gagal}
╰━━━━━━━━━━━━━━━━━━━🍁
`
        })

    } catch (err) {
        console.log("ERROR GASJOIN:", err)
    }
}