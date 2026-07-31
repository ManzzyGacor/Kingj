async function listgc(sock, sender, message) {
    try {
        const groups = await sock.groupFetchAllParticipating();

        const groupList = Object.values(groups).map(group => ({
            id: group.id,
            name: group.subject,
            size: group.size,
            announce: group.announce
        }));

        const totalGrub = groupList.length;
        const grubTerbuka = groupList.filter(g => !g.announce).length;
        const grubTertutup = groupList.filter(g => g.announce).length;

        groupList.sort((a, b) => b.size - a.size);

        let msg = `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃      🍁 *${global.name_script}* 🍁
┃
┃  📦 Total Grup   : *${totalGrub}*
┃  🟢 Terbuka      : *${grubTerbuka}*
┃  🔒 Tertutup     : *${grubTertutup}*
┃
╰━━━━━━━━━━━━━━━━━━━━🍁

🍂 *Detail Grup:*
`;

        groupList.forEach((group, index) => {
            const status = group.announce ? "🔒 Tertutup" : "🟢 Terbuka";
            msg += `
╭─🍁 ${index + 1}. *${group.name}*
┃ 👥 Member : ${group.size}
┃ 🆔 ID     : ${group.id}
┃ 📌 Status : ${status}
╰───────────────🍁
`;
        });

        await sock.sendMessage(sender, { text: msg });

    } catch (error) {
        console.error('Gagal mendapatkan daftar grup:', error);
        await sock.sendMessage(sender, { 
            text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ ❌ Gagal mengambil daftar grup
┃ Silakan coba lagi nanti.
╰━━━━━━━━━━━━━━━━━━━━🍁
`
        });
    }
}

export default listgc;