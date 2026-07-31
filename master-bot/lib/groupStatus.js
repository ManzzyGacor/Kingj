import * as baileys from 'baileys';
import crypto from 'node:crypto';

export async function groupStatus(sock, jid, content) {

    try {

        const inside = await baileys.generateWAMessageContent(
            content,
            { upload: sock.waUploadToServer }
        );

        const messageSecret = crypto.randomBytes(32);

        const msg = baileys.generateWAMessageFromContent(
            jid,
            {
                messageContextInfo: { messageSecret },
                groupStatusMessageV2: {
                    message: {
                        ...inside,
                        messageContextInfo: { messageSecret }
                    }
                }
            },
            {}
        );

        await sock.relayMessage(
            jid,
            msg.message,
            { messageId: msg.key.id }
        );

        return msg.key.id;

    } catch (err) {
        console.log("Error SWGC:", err);
        return null;
    }
}