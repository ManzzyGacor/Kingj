let status = false;

// Reset counter per grup
function resetChatCounter(sender) {
  if (global.chatCounter[sender]) {
    global.chatCounter[sender].total = 0;
  }
}

async function autoreply(sock, sender, messages, key, messageEvent) {

  // Jika sudah aktif
  if (status) {
    await sock.sendMessage(sender, {
      text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃      🍁 *${global.name_script}* 🍁
┃
┃ ✅ Autoreply sudah aktif
┃ Gunakan dengan bijak 🌿
╰━━━━━━━━━━━━━━━━━━━━🍁
`
    });
    return;
  }

  const parts = messages.trim().split(" ");

  // Validasi format
  if (parts.length < 2) {
    return sock.sendMessage(sender, {
      text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃      🍁 *${global.name_script}* 🍁
┃
┃ 📌 Format:
┃ autoreply <pesan>
┃
┃ 📌 Contoh:
┃ autoreply Halo Gua Kalexxz 👋
╰━━━━━━━━━━━━━━━━━━━━🍁
`
    });
  }

  status = true;

  await sock.sendMessage(sender, {
    text: `
╭━━━━━━━━━━━━━━━━━━━━🍁
┃ ✅ Autoreply berhasil diaktifkan
┃ ⏳ Bot akan mengirim pesan otomatis
┃ setiap 1 menit jika grup aktif
╰━━━━━━━━━━━━━━━━━━━━🍁
`
  });

  const interval = setInterval(async () => {

    const activeGroups = Object.keys(global.chatCounter || {});

    if (activeGroups.length === 0) {
      console.log("⛔ Tidak ada grup aktif...");
      return;
    }

    const text = parts.slice(1).join(" ");
    if (!text) {
      return sock.sendMessage(sender, { react: { text: "🚫", key } });
    }

    await sock.sendMessage(sender, { react: { text: "🍁", key } });

    for (const groupId of activeGroups) {
      try {

        if (global.chatCounter[groupId]?.total < 1) continue;

        await sock.sendMessage(groupId, { text });

        console.log(`🍁 Terkirim ke ${groupId}`);

        resetChatCounter(groupId);

        await new Promise((resolve) =>
          setTimeout(resolve, global.jeda || 10000)
        );

      } catch (err) {
        console.error(`❌ Gagal kirim ke ${groupId}:`, err.message);
      }
    }

  }, 60 * 1000); // Loop utama tiap 1 menit
}

export default autoreply;