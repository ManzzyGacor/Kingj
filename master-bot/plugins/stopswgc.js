export default async function stopswgc(sock, sender) {
    global.swgcStop = true;

    return sock.sendMessage(sender, {
        text:
`🍁 *SWGC DIHENTIKAN*

🛑 Perintah stop diterima.
Proses pengiriman akan dihentikan...`
    });
}