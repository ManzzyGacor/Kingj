async function ping(sock, sender, message, key, messageEvent) {

    const msg = `
╭━━━━━━━━━━━━━━━━━━━🍁
┃   🍁 *${global.name_script}* 🍁
┃
┃  🧩 Version : *${global.version}*
┃  🟢 Status  : *Online*
┃  ⏰ Time    : ${new Date().toLocaleTimeString("id-ID")}
┃  🌐 web    : https://jpm.manzzy.web.id
┃   *©ManzzyID*
╰━━━━━━━━━━━━━━━━━━━🍁
`;

    await sock.sendMessage(sender, { text: msg });
}

export default ping;