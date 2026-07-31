export async function deleteGroupStatus(sock, jid, messageId) {
    try {

        await sock.relayMessage(
            jid,
            {
                protocolMessage: {
                    key: {
                        remoteJid: jid,
                        id: messageId
                    },
                    type: 0
                }
            },
            {}
        );

        return true;

    } catch (err) {
        console.log("Gagal hapus SWGC:", err);
        return false;
    }
}