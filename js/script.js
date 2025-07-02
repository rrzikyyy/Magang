// Jalankan setelah DOM ter-load
document.addEventListener('DOMContentLoaded', () => {
    // Cek di halaman mana kita berada
    if (document.body.id === 'loginPage') initLoginPage();
    if (document.body.id === 'registerPage') initRegisterPage();
    if (document.body.id === 'pesertaPage') initPesertaPage();
    if (document.body.id === 'adminPage') initAdminPage();
});

// --- UTILITIES ---
function showPopup(message, isSuccess = true) {
    const popup = document.createElement('div');
    popup.className = `popup ${isSuccess ? '' : 'error'}`;
    popup.textContent = message;
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);

    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(popup);
        }, 500);
    }, 3000);
}

// --- API INTEGRATION ---
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzhcRMaA7vUJlMQNHO7Tlozgp8tKSxLe9qo-ExBaF3SXDK6cjhaDPtaozPWkHfryCNV-w/exec'; // Ganti dengan URL Anda
const TELEGRAM_BOT_TOKEN = '8058816337:AAFpktsMN28FEG4GuTs1zCv8RbIvNEly1Hk'; // Ganti dengan Token Bot Anda
const TELEGRAM_CHAT_ID = '7970818477'; // Ganti dengan Chat ID Anda

async function sendToGoogleSheet(data) {
    try {
        // Menggunakan fetch dengan mode 'no-cors' tidak akan mengembalikan status sukses
        // Jadi kita anggap berhasil jika tidak ada error.
        await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return true;
    } catch (error) {
        console.error('Error sending to Google Sheet:', error);
        showPopup('Gagal terhubung ke server Google.', false);
        return false;
    }
}

async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        console.error('Error sending to Telegram:', error);
    }
}

// --- LOGIN PAGE ---
function initLoginPage() {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        // Cek login admin statis
        if (role === 'admin') {
            if (email === 'admin@kai.id' && password === 'admin123') {
                showPopup('Login Admin Berhasil!');
                sessionStorage.setItem('loggedInUser', JSON.stringify({ name: 'Admin', role: 'admin' }));
                window.location.href = 'admin.html';
            } else {
                showPopup('Email atau Password Admin salah!', false);
            }
            return;
        }

        // Cek login peserta dari localStorage
        if (role === 'peserta') {
            const users = JSON.parse(localStorage.getItem('intern_users')) || [];
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                showPopup(`Selamat Datang, ${user.name}!`);
                sessionStorage.setItem('loggedInUser', JSON.stringify({ ...user, role: 'peserta' }));
                window.location.href = 'peserta.html';
            } else {
                showPopup('Email atau Password Peserta salah!', false);
            }
        }
    });
}

// --- REGISTER PAGE ---
function initRegisterPage() {
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const newUser = {
            id: 'user_' + Date.now(),
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        let users = JSON.parse(localStorage.getItem('intern_users')) || [];
        if (users.find(u => u.email === newUser.email)) {
            showPopup('Email sudah terdaftar!', false);
            return;
        }
        
        users.push(newUser);
        localStorage.setItem('intern_users', JSON.stringify(users));
        showPopup('Registrasi berhasil! Silakan login.');
        setTimeout(() => window.location.href = 'index.html', 1500);
    });
}

// --- PESERTA PAGE ---
function initPesertaPage() {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'peserta') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userName').textContent = loggedInUser.name;
    document.getElementById('dataDiriContent').innerHTML = `
        <p><strong>Nama:</strong> ${loggedInUser.name}</p>
        <p><strong>Email:</strong> ${loggedInUser.email}</p>
    `;

    // Logout
    document.getElementById('logoutButton').addEventListener('click', () => {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    });
    
    // --- FUNGSI BARU: Cek Status Keterlambatan ---
    function getAttendanceStatus(shift) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        let shiftStartHour, shiftEndHour;
        const gracePeriodMinutes = 10; // Pengingat absen 10 menit sebelum mulai

        switch(shift) {
            case 'Pagi (06:00-14:00)':
                shiftStartHour = 6;
                break;
            case 'Siang (14:00-22:00)':
                shiftStartHour = 14;
                break;
            case 'Malam (22:00-06:00)':
                shiftStartHour = 22;
                break;
            default:
                return 'Jadwal Tidak Valid';
        }
        
        const shiftStartTime = new Date(now);
        shiftStartTime.setHours(shiftStartHour, 0, 0, 0); // Jam mulai dinas

        const lateTime = new Date(shiftStartTime);
        lateTime.setMinutes(shiftStartTime.getMinutes() + gracePeriodMinutes); // Batas akhir tepat waktu

        if (now > lateTime) {
            return 'Terlambat';
        } else {
            return 'Tepat Waktu';
        }
    }

    // Absensi Form
    document.getElementById('absensiForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const status = document.getElementById('status').value;
        const dinas = document.getElementById('dinas').value;
        const fotoInput = document.getElementById('foto');
        
        if (status === 'Hadir' && !fotoInput.files[0]) {
            showPopup('Untuk status Hadir, foto wajib dilampirkan!', false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async position => {
            const { latitude, longitude } = position.coords;
            const timestamp = new Date();
            const timeString = timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            
            // --- LOGIKA BARU: Tentukan status keterlambatan ---
            let attendanceStatus = "-"; // Default untuk Izin/Sakit
            if (status === 'Hadir') {
                attendanceStatus = getAttendanceStatus(dinas);
            }
            
            const attendanceData = {
                type: 'absensi',
                timestamp: timestamp.toISOString(),
                nama: loggedInUser.name,
                status: status,
                dinas: dinas,
                waktu: timeString,
                lokasi: `${latitude}, ${longitude}`,
                keterangan: attendanceStatus, // Kirim status keterlambatan
                foto: 'Foto Terlampir'
            };
            
            showPopup('Mengirim data absensi...');
            const success = await sendToGoogleSheet(attendanceData);
            if(success) {
               showPopup('Absensi berhasil direkam!');
               // --- Notif Telegram di-update ---
               let telegramMessage = `<b>🔔 ABSENSI MASUK</b>\n\n- <b>Nama:</b> ${loggedInUser.name}\n- <b>Status:</b> ${status}\n- <b>Dinas:</b> ${dinas}\n- <b>Waktu:</b> ${timeString}`;
               if (status === 'Hadir') {
                   telegramMessage += `\n- <b>Keterangan:</b> ${attendanceStatus}`;
               }
               await sendToTelegram(telegramMessage);
               document.getElementById('absensiForm').reset();
            } else {
               showPopup('Gagal mengirim data!', false);
            }

        }, () => {
            showPopup('Gagal mendapatkan lokasi. Pastikan GPS aktif!', false);
        });
    });
    
    // --- LOGIKA BARU: LOGBOOK ---
    const logbookForm = document.getElementById('logbookForm');
    const logbookList = document.getElementById('logbookList');
    const userLogbookKey = `logbook_${loggedInUser.id}`;

    // Fungsi untuk menampilkan logbook dari localStorage
    function renderLogbook() {
        logbookList.innerHTML = ''; // Kosongkan list
        const savedLogs = JSON.parse(localStorage.getItem(userLogbookKey)) || [];
        if (savedLogs.length === 0) {
            logbookList.innerHTML = '<p>Belum ada riwayat logbook.</p>';
        } else {
            savedLogs.forEach(log => {
                const entry = document.createElement('div');
                entry.className = 'log-entry';
                entry.innerHTML = `<p><strong>${new Date(log.timestamp).toLocaleDateString('id-ID')}:</strong> ${log.aktivitas}</p>`;
                logbookList.appendChild(entry);
            });
        }
    }

    // Tampilkan logbook saat halaman dimuat
    renderLogbook();

    // Simpan logbook baru
    logbookForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const aktivitas = document.getElementById('aktivitas').value;
        const timestamp = new Date().toISOString();

        const logbookData = {
            type: 'logbook',
            timestamp: timestamp,
            nama: loggedInUser.name,
            aktivitas: aktivitas,
        };

        showPopup('Menyimpan logbook...');
        const success = await sendToGoogleSheet(logbookData);
        if (success) {
            // Simpan ke localStorage
            const savedLogs = JSON.parse(localStorage.getItem(userLogbookKey)) || [];
            savedLogs.unshift(logbookData); // Tambahkan ke awal array
            localStorage.setItem(userLogbookKey, JSON.stringify(savedLogs));
            
            showPopup('Logbook harian berhasil disimpan!');
            logbookForm.reset();
            renderLogbook(); // Tampilkan ulang daftar logbook
        } else {
            showPopup('Gagal menyimpan logbook!', false);
        }
    });
}

// --- ADMIN PAGE ---
function initAdminPage() {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('logoutButtonAdmin').addEventListener('click', () => {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    });
    
    document.getElementById('remindButton').addEventListener('click', () => {
        const message = '<b>📢 PENGINGAT ABSENSI</b>\n\nJangan lupa untuk melakukan absensi 10 menit sebelum jam dinas Anda dimulai. Terima kasih!';
        sendToTelegram(message);
        showPopup('Notifikasi pengingat absen telah dikirim ke Telegram!');
    });

    // Ganti ID_SPREADSHEET_ANDA dengan ID Spreadsheet Anda.
    const SPREADSHEET_ID = 'ID_SPREADSHEET_ANDA';
    document.getElementById('sheetLink').innerHTML = `
        <p>Semua data rekapan absensi dan logbook dapat dilihat secara real-time di Google Sheet.</p>
        <a href="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit" target="_blank">
            <button>Buka Rekapan Google Sheet</button>
        </a>
    `;
}
