// =======================================================================
// PASTE URL APLIKASI WEB (GOOGLE APPS SCRIPT) ANDA DI SINI
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyjd0Yh8G8RRDCw6n51QcuzzzXpNXYZyQzSLHeLNScO2ObFkuLP0TJlIa1ByQewYrOHKg/exec'; 
// =======================================================================


// Fungsi Notifikasi (sama seperti di main.js)
function showNotification(message, isError = false) { const notification = document.getElementById('notification');
    if (!notification) return;
    notification.textContent = message;
    notification.style.backgroundColor = isError ? 'var(--danger)' : 'var(--success)';
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
     }


document.addEventListener('DOMContentLoaded', () => {
    const adminKey = sessionStorage.getItem('adminKey');
    if (!adminKey) {
        alert('Akses ditolak! Silakan login sebagai admin terlebih dahulu.');
        window.location.href = 'index.html';
        return;
    }
    // Jika ada kunci, muat datanya
    loadAbsensi(adminKey);
    loadLogbook(adminKey);
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('adminKey');
    window.location.href = 'index.html';
});

// Muat data Absensi dari Google Sheets
async function loadAbsensi(key) {
    const tabelBody = document.querySelector('#tabel-absensi tbody');
    tabelBody.innerHTML = '<tr><td colspan="8">Memuat data...</td></tr>';
    
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getAbsensi&key=${key}`);
        const data = await response.json();

        if (data.status === 'error') throw new Error(data.message);

        tabelBody.innerHTML = ''; // Kosongkan tabel
        data.forEach(item => {
            const tgl = new Date(item.timestamp).toLocaleDateString('id-ID');
            const waktu = new Date(item.timestamp).toLocaleTimeString('id-ID');
            const lokasiLink = `https://www.google.com/maps?q=${item.latitude},${item.longitude}`;

            const row = `
                <tr>
                    <td>${item.nama}</td>
                    <td>${tgl}</td>
                    <td>${item.dinas}</td>
                    <td><span class="${item.keterangan === 'Terlambat' ? 'status-terlambat' : 'status-hadir'}">${item.status}</span></td>
                    <td>${waktu}</td>
                    <td>${item.keterangan}</td>
                    <td><a href="${lokasiLink}" target="_blank">Lihat Lokasi</a></td>
                    <td><a href="${item.foto_url}" target="_blank">Lihat Foto</a></td>
                </tr>
            `;
            tabelBody.innerHTML += row;
        });
    } catch (error) {
        tabelBody.innerHTML = `<tr><td colspan="8">Gagal memuat data: ${error.message}</td></tr>`;
    }
}

// Muat data Logbook
async function loadLogbook(key) {
     const tabelBody = document.querySelector('#tabel-logbook tbody');
    tabelBody.innerHTML = '<tr><td colspan="3">Memuat data...</td></tr>';
    
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getLogbook&key=${key}`);
        const data = await response.json();
        
        if (data.status === 'error') throw new Error(data.message);

        tabelBody.innerHTML = '';
        data.forEach(item => {
            const tgl = new Date(item.timestamp).toLocaleDateString('id-ID');
            const row = `
                <tr>
                    <td>${item.nama}</td>
                    <td>${tgl}</td>
                    <td><p style="white-space: pre-wrap;">${item.aktivitas}</p></td>
                </tr>
            `;
            tabelBody.innerHTML += row;
        });
    } catch (error) {
        tabelBody.innerHTML = `<tr><td colspan="3">Gagal memuat data: ${error.message}</td></tr>`;
    }
}

// Export PDF dan kirim pengumuman Telegram tetap sama karena menggunakan library client-side
// dan API publik, jadi tidak perlu diubah.
// ... (Kode untuk export PDF dan Telegram bisa disalin dari jawaban sebelumnya) ...
