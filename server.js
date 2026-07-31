import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';


import User from './models/User.js';
import ServerInstance from './models/ServerInstance.js';
import Settings from './models/Settings.js';

dotenv.config();
const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Konfigurasi Database MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
      console.log('✅ Terhubung ke MongoDB (manzzygenshin_db_user)');
      // Inisialisasi default max server jika belum ada
      const limitSetting = await Settings.findOne({ key: 'maxServers' });
      if (!limitSetting) {
          await Settings.create({ key: 'maxServers', value: 15 });
      }
  })
  .catch(err => console.error('❌ Gagal koneksi MongoDB:', err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'kingjpmsecret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

// Middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) return next();
    res.redirect('/login');
};

const isAdmin = async (req, res, next) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    if (user && user.role === 'admin') {
        req.user = user;
        return next();
    }
    res.status(403).send('Akses ditolak. Khusus Admin KING JPM.');
};

// --- AUTH ROUTES ---

app.get('/', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    res.redirect('/login');
});

app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.render('login', { error: 'Username tidak ditemukan!' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.render('login', { error: 'Password salah!' });

        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.role = user.role;
        
        if (user.role === 'admin') return res.redirect('/admin');
        res.redirect('/dashboard');
    } catch (err) {
        res.render('login', { error: 'Terjadi kesalahan pada server.' });
    }
});

app.get('/register', (req, res) => res.render('register', { error: null }));
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.render('register', { error: 'Username sudah digunakan!' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const assignedRole = (username.toLowerCase() === 'man') ? 'admin' : 'user';

        await User.create({ username, password: hashedPassword, role: assignedRole });
        res.redirect('/login');
    } catch (err) {
        res.render('register', { error: 'Gagal melakukan pendaftaran.' });
    }
});

app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

// --- DASHBOARD USER ---

app.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (user.role === 'admin') return res.redirect('/admin');

        const servers = await ServerInstance.find({ userId: user._id });
        const activeCount = await ServerInstance.countDocuments({ status: 'active' });
        
        const limitSetting = await Settings.findOne({ key: 'maxServers' });
        const maxLimit = limitSetting ? limitSetting.value : 15;

        const vpsStats = {
            cpuUsage: (Math.random() * 15 + 8).toFixed(1) + '%',
            ramUsage: '1.4 GB / 4.0 GB',
            diskUsage: '16.2 GB / 50 GB',
            uptime: '12 Hari 4 Jam',
            os: 'Ubuntu 22.04 LTS x64'
        };

        res.render('dashboard', { user, servers, vpsStats, totalActiveServers: activeCount, maxLimit });
    } catch (err) {
        res.status(500).send('Kesalahan memuat dashboard.');
    }
});

app.post('/profile/update', isAuthenticated, async (req, res) => {
    try {
        const { profileImage } = req.body;
        await User.findByIdAndUpdate(req.session.userId, { profileImage });
        res.redirect('/dashboard');
    } catch (err) {
        res.status(500).send('Gagal memperbarui profil.');
    }
});

// --- REAL PAKASIR API INTEGRATION ---

app.post('/server/buy', isAuthenticated, async (req, res) => {
    try {
        const { serverName, botNumber, ownerNumber, prefix, duration } = req.body;
        
        const limitSetting = await Settings.findOne({ key: 'maxServers' });
        const maxLimit = limitSetting ? limitSetting.value : 15;
        const activeCount = await ServerInstance.countDocuments({ status: 'active' });
        
        if (activeCount >= maxLimit) {
            return res.status(400).send(`Mohon maaf, slot server JPM penuh (Maksimal ${maxLimit} server).`);
        }

        let price = 0;
        let days = parseInt(duration);
        if (days === 10) price = 4000;
        else if (days === 20) price = 6000;
        else if (days === 30) price = 9000;
        else return res.status(400).send('Durasi tidak valid.');

        const orderId = `KINGJPM-${Date.now()}`;
        const slug = 'kingjpm';
        const apiKey = 'Xs25AnZO2UW08aIapO4l3gyxTjJCCFKB';

        // Kirim request real ke API Pakasir
        const response = await fetch(`https://app.pakasir.com/api/transactioncreate/qris`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project: slug,
                order_id: orderId,
                amount: price,
                api_key: apiKey
            })
        });

        const data = await response.json();
        
        if (!data.payment) {
            return res.status(400).send('Gagal membuat transaksi ke Pakasir: ' + JSON.stringify(data));
        }

        // Simpan instance sementara dengan status pending
        const randomDigits = Math.floor(100 + Math.random() * 900);
        const folderSlug = `${req.session.username.toLowerCase()}_${randomDigits}`;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        await ServerInstance.create({
            userId: req.session.userId,
            serverName,
            botNumber,
            ownerNumber,
            prefix: prefix || '.',
            durationDays: days,
            status: 'pending',
            orderId: orderId,
            folderName: folderSlug,
            expiresAt
        });

        // Render halaman pembayaran QRIS
        res.render('payment', {
            payment: data.payment,
            serverData: { serverName, botNumber, orderId }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Gagal memproses pembayaran Pakasir.');
    }
});

// --- WEBHOOK PAKASIR & AUTO DEPLOYMENT ---

app.post('/api/webhook/pakasir', async (req, res) => {
    try {
        const { order_id, amount, status, project } = req.body;
        
        if (project !== 'kingjpm') return res.status(400).json({ error: 'Invalid project' });

        const serverInstance = await ServerInstance.findOne({ orderId: order_id });
        if (!serverInstance) return res.status(404).json({ error: 'Order not found' });

        if (status === 'completed' && serverInstance.status === 'pending') {
            serverInstance.status = 'active';
            await serverInstance.save();

            // OTOMATISASI SETUP SCRIPT BOT DI VPS
            const folderName = serverInstance.folderName;
            const masterPath = path.join(__dirname, 'master-bot'); // Folder master script bot kamu
            const targetPath = path.join(__dirname, 'instances', folderName);

            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
                
                // Copy file script utama jika master ada, atau buat instance kosong
                if (fs.existsSync(masterPath)) {
                    fs.cpSync(masterPath, targetPath, {
                        recursive: true,
                        filter: (src) => !src.includes('node_modules') && !src.includes('sessions') && !src.includes('database')
                    });
                    
                    // Buat symlink node_modules agar hemat storage
                    const masterNodeModules = path.join(masterPath, 'node_modules');
                    const targetNodeModules = path.join(targetPath, 'node_modules');
                    if (fs.existsSync(masterNodeModules) && !fs.existsSync(targetNodeModules)) {
                        fs.symlinkSync(masterNodeModules, targetNodeModules, 'junction');
                    }
                }

                // Tulis config.js otomatis
                const configContent = `
const numberAllowed = ["${serverInstance.ownerNumber}"];
global.prefix = ["${serverInstance.prefix}"];
global.jeda = 15000;
global.name_script = "${serverInstance.serverName}";
global.version = "1.0";
global.botNumber = "${serverInstance.botNumber}";
global.autojpm = { hidetag: false, jedaPutaran: 10000 };
export { numberAllowed };
`;
                fs.writeFileSync(path.join(targetPath, 'config.js'), configContent.trim());

                // Jalankan bot via PM2
                const pm2Name = `bot-${folderName}`;
                exec(`pm2 start index.js --name "${pm2Name}" --cwd "${targetPath}"`, (err) => {
                    if (err) console.error(`Gagal run PM2 ${pm2Name}:`, err);
                });
            }
        }

        res.json({ status: 'success' });
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({ error: err.message });
    }
});
// --- AUTO HAPUS SERVER EXPIRED (Berjalan setiap 1 Jam) ---
setInterval(async () => {
    try {
        // Cari server yang statusnya 'active' tapi waktunya sudah lewat hari ini
        const expiredServers = await ServerInstance.find({
            status: 'active',
            expiresAt: { $lte: new Date() }
        });

        for (const server of expiredServers) {
            // Ubah status di database
            server.status = 'expired';
            await server.save();

            const folderName = server.folderName;
            const targetPath = path.join(__dirname, 'instances', folderName);
            const pm2Name = `bot-${folderName}`;

            console.log(`Menghapus server JPM expired: ${pm2Name}`);

            // 1. Matikan dan hapus dari list PM2
            exec(`pm2 delete "${pm2Name}"`, (err) => {
                if (err) console.error(`Gagal menghapus PM2 ${pm2Name}:`, err.message);
            });

            // 2. Hapus folder server pembeli beserta isinya
            if (fs.existsSync(targetPath)) {
                fs.rmSync(targetPath, { recursive: true, force: true });
            }
        }
    } catch (err) {
        console.error('Error pengecekan server expired:', err);
    }
}, 60 * 60 * 1000); // 60 * 60 * 1000 ms = 1 Jam
// --- ADMIN PANEL ROUTES ---

app.get('/admin', isAdmin, async (req, res) => {
    try {
        const users = await User.find({});
        const servers = await ServerInstance.find({}).populate('userId');
        const limitSetting = await Settings.findOne({ key: 'maxServers' });
        
        res.render('admin', {
            user: req.user,
            users,
            servers,
            maxServers: limitSetting ? limitSetting.value : 15
        });
    } catch (err) {
        res.status(500).send('Gagal memuat panel admin.');
    }
});

app.post('/admin/settings/limit', isAdmin, async (req, res) => {
    try {
        const { maxServers } = req.body;
        await Settings.findOneAndUpdate({ key: 'maxServers' }, { value: parseInt(maxServers) }, { upsert: true });
        res.redirect('/admin');
    } catch (err) {
        res.status(500).send('Gagal mengubah batas server.');
    }
});


// --- HALAMAN DETAIL SERVER USER ---
app.get('/server/:id', isAuthenticated, async (req, res) => {
    try {
        const server = await ServerInstance.findOne({ _id: req.params.id, userId: req.session.userId });
        if (!server) return res.status(404).send('Server tidak ditemukan atau bukan milik Anda.');

        const targetPath = path.join(__dirname, 'instances', server.folderName);
        const pm2Name = `bot-${server.folderName}`;

        // Cek status PM2 secara real-time
        let pm2Status = 'stopped';
        try {
            const { stdout } = await execPromise(`pm2 jlist`);
            const list = JSON.parse(stdout);
            const proc = list.find(p => p.name === pm2Name);
            if (proc && proc.pm2_env.status === 'online') {
                pm2Status = 'online';
            }
        } catch (e) {
            console.error('Gagal cek status PM2:', e);
        }

        // Ambil log terakhir untuk mencari pairing code jika ada
        let pairingCode = 'Belum digenerate / Bot sudah terkoneksi';
        try {
            const logPath = path.join(process.env.HOME || '/root', '.pm2', 'logs', `${pm2Name}-out.log`);
            if (fs.existsSync(logPath)) {
                const logContent = fs.readFileSync(logPath, 'utf8');
                const matches = logContent.match(/Code Pairing\s*:\s*([0-9-]+)/g);
                if (matches && matches.length > 0) {
                    const lastMatch = matches[matches.length - 1];
                    pairingCode = lastMatch;
                }
            }
        } catch (e) {}

        res.render('server-detail', {
            user: await User.findById(req.session.userId),
            server,
            pm2Status,
            pairingCode
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Gagal memuat detail server.');
    }
});

// --- KONTROL SERVER (START / STOP / RESTART) ---
app.post('/server/:id/control', isAuthenticated, async (req, res) => {
    try {
        const { action } = req.body; // 'start', 'stop', 'restart'
        const server = await ServerInstance.findOne({ _id: req.params.id, userId: req.session.userId });
        if (!server) return res.status(404).send('Server tidak ditemukan.');

        const targetPath = path.join(__dirname, 'instances', server.folderName);
        const pm2Name = `bot-${server.folderName}`;

        if (action === 'start') {
            if (!fs.existsSync(targetPath)) {
                return res.status(400).send('Folder instance bot tidak ditemukan di VPS.');
            }
            await execPromise(`pm2 start index.js --name "${pm2Name}" --cwd "${targetPath}"`);
        } else if (action === 'stop') {
            await execPromise(`pm2 stop "${pm2Name}"`);
        } else if (action === 'restart') {
            await execPromise(`pm2 restart "${pm2Name}"`);
        }

        res.redirect(`/server/${server._id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Gagal menjalankan perintah kontrol server.');
    }
});

// --- EDIT KONFIGURASI SERVER ---
app.post('/server/:id/update', isAuthenticated, async (req, res) => {
    try {
        const { serverName, botNumber, ownerNumber, prefix } = req.body;
        const server = await ServerInstance.findOne({ _id: req.params.id, userId: req.session.userId });
        if (!server) return res.status(404).send('Server tidak ditemukan.');

        // Update database
        server.serverName = serverName;
        server.botNumber = botNumber;
        server.ownerNumber = ownerNumber;
        server.prefix = prefix;
        await server.save();

        // Update file config.js di folder instance user secara otomatis
        const targetPath = path.join(__dirname, 'instances', server.folderName);
        const configPath = path.join(targetPath, 'config.js');

        const configContent = `
const numberAllowed = ["${ownerNumber}"];
global.prefix = ["${prefix}"];
global.jeda = 15000;
global.name_script = "${serverName}";
global.version = "1.0";
global.botNumber = "${botNumber}";
global.autojpm = { hidetag: false, jedaPutaran: 10000 };
export { numberAllowed };
`;
        if (fs.existsSync(targetPath)) {
            fs.writeFileSync(configPath, configContent.trim());
        }

        res.redirect(`/server/${server._id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Gagal memperbarui konfigurasi server.');
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 KING JPM Server berjalan di port ${process.env.PORT || 3000}`);
});