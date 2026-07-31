export default async function jpmstop(sock, sender) {
    global.jpmStop = true;

    return sock.sendMessage(sender, {
        text:
`🍁 *JPM DIHENTIKAN KONTOL*

🛑 Perintah stop diterima.
Proses pengiriman akan dihentikan...`
    });
}