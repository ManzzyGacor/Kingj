

console.log('Start App ..')

import fs from "fs";
import path from "path";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "baileys";
import { Boom } from "@hapi/boom";
import P from "pino";
import qrcode from "qrcode-terminal";
import clc from "cli-color";

// Import config untuk membaca global.botNumber
import "./config.js";

import {
  deleteFolderRecursive,
  ChangeStatus,
  getStatus,
  handleCommand,
  displayTime,
  logWithTime
} from "./lib/utils.js";

import resumeAutoJPM from "./lib/resumeAutoJPM.js";

// Pengganti __dirname di ESM
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basePath = __dirname;
const status = getStatus(`${basePath}/sessions/`);

async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("sessions");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      connectTimeoutMs: 6000,
      logger: P({ level: "silent" }),
    });

    sock.ev.on("connection.update", (update) =>
      handleConnectionUpdate(sock, update)
    );
    sock.ev.on("messages.upsert", (message) =>
      handleIncomingMessages(sock, message)
    );
    sock.ev.on("creds.update", saveCreds);
  } catch (error) {
    logWithTime("Failed to connect to WhatsApp", "red");
  }
}

async function handleConnectionUpdate(sock, update) {
  const { connection, lastDisconnect, qr } = update;
  
  if (
    connection === "connecting" &&
    global.botNumber &&
    !sock.authState.creds.registered
  ) {
    const phoneNumber = global.botNumber.toString();
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    console.log(clc.yellow(`Meminta Code Pairing untuk nomor: ${phoneNumber}...`));
    await delay(3000);
    try {
      const code = await sock.requestPairingCode(phoneNumber.trim());
      const formattedCode = code.slice(0, 4) + "-" + code.slice(4);

      console.log(`${clc.green.bold("Code Pairing :")} ${formattedCode}`);
    } catch (err) {
      console.log(clc.red("Gagal meminta pairing code:"), err);
    }
  } else if (qr) {
    qrcode.generate(qr, { small: true });
    console.log(clc.red.bold("Please scan the QR code displayed above."));
  }

  if (connection === "close") {
    const shouldReconnect =
      lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
    logWithTime("Connection Closed", "red");
    ChangeStatus(`${basePath}/sessions/`, "closed");
    if (shouldReconnect) {
      connectToWhatsApp();
    }
  } else if (connection === "open") {
    logWithTime("Connection Success", "green");
    ChangeStatus(`${basePath}/sessions/`, "connected");
    // Setelah sock siap:
    resumeAutoJPM(sock);
  }
}

async function handleIncomingMessages(sock, messageEvent) {
  try {
    const message = messageEvent.messages?.[0];
    if (!message) throw new Error("Message is undefined or empty");
    const type = messageEvent?.type ?? false;
    if (type && type == "append") {
      return false; // cegah bot kirim berulang
    }

    // Determine if the message is from a group
    const isGroup = Boolean(message.key?.participant);
    const sender = message.key?.remoteJidAlt || message.key?.remoteJid;
    const key = message?.key;
    // Determine the sender number based on whether the message is from a group or not
    const senderNumber = (() => {
      if (isGroup) {
        const participant = message.key?.participantAlt || message.key?.participant;
        return participant ? participant.split("@")[0] : "unknown";
      } else {
        return sender ? sender.split("@")[0] : "unknown";
      }
    })();

    const fromMe = message.key?.fromMe ?? false;
    const status = message?.status ?? false;
    const textMessage =
      message.message?.extendedTextMessage?.text ||
      message.message?.conversation ||
      message.message?.imageMessage?.caption ||
      "";

    if (textMessage) {
      await handleCommand(
        sock,
        sender,
        textMessage.trim(),
        key,
        senderNumber,
        messageEvent,
        fromMe
      );
    }
  } catch (error) {
    console.log(
      clc.yellow.underline(
        `[${displayTime()}] Failed to handle incoming message!`
      )
    );
  }
}

// Eksekusi utama langsung berjalan tanpa readline terminal
logWithTime("Starting Bot Instance...", "green");
connectToWhatsApp();