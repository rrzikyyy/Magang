// =======================================================================
// PASTE URL APLIKASI WEB (GOOGLE APPS SCRIPT) ANDA DI SINI
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyjd0Yh8G8RRDCw6n51QcuzzzXpNXYZyQzSLHeLNScO2ObFkuLP0TJlIa1ByQewYrOHKg/exec'; 
// =======================================================================


// Fungsi Notifikasi
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.textContent = message;
    notification.style.backgroundColor = isError ? 'var(--danger)' : 'var(--success)';
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Logika logout sederhana (hanya kembali ke halaman utama)
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        // Hapus data peserta dari local storage jika ada
        localStorage.removeItem('pesertaData');
        window.location.href = 'index.html';
    });
}

// Cek jika ada data peserta di local storage dan tampilkan
document.addEventListener('DOMContentLoaded', () => {
    const pesertaData = JSON.parse(localStorage.getItem('pesertaData'));
    if (pesertaData) {
        document.getElementById('nama-peserta').textContent = pesertaData.nama;
        document.getElementById('nim-peserta').textContent = pesertaData.nim;
    } else {
        // Jika tidak ada data, paksa kembali ke login
        alert('Data peserta tidak ditemukan! Silakan isi data diri terlebih dahulu.');
        window.location.href = 'index.html';
    }
});


// Fitur Lokasi
function getLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => resolve({
                    lat: position.coords.latitude,
                    long: position.coords.longitude
                }),
                () => reject('Gagal mendapatkan lokasi. Pastikan GPS aktif dan berikan izin.'),
                { enableHighAccuracy: true }
            );
        } else {
            reject('Geolocation tidak didukung browser ini.');
        }
    });
}

// Logika Form Absensi
document.getElementById('absensiForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');

    const status = document.getElementById('status').value;
    const fotoInput = document.getElementById('dokumentasi');
    
    // Validasi sederhana: foto wajib jika hadir
    if (status === 'Hadir' && fotoInput.value.trim() === '') {
        showNotification('Link Foto Dokumentasi wajib diisi untuk status Hadir.', true);
        return;
    }
    
    submitButton.disabled = true;
    showNotification('Mengirim data absensi...', false);

    try {
        const location = await getLocation();
        const pesertaData = JSON.parse(localStorage.getItem('pesertaData'));

        const now = new Date();
        const dinas = document.getElementById('dinas').value;
        const jamMasuk = { 'Pagi': 6, 'Siang': 14, 'Malam': 22 };
        let keterangan = 'Tepat Waktu';
        if (status === 'Hadir' && now.getHours() >= jamMasuk[dinas]) {
            // Toleransi 15 menit
            if (now.getHours() === jamMasuk[dinas] && now.getMinutes() > 15) {
                keterangan = 'Terlambat';
            } else if (now.getHours() > jamMasuk[dinas]) {
                 keterangan = 'Terlambat';
            }
        }

        const dataToSend = {
            type: "absensi",
            nama: pesertaData.nama,
            nim: pesertaData.nim,
            status: status,
            dinas: dinas,
            location: location,
            keterangan: keterangan,
            foto_url: fotoInput.value.trim()
        };

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(dataToSend),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();
        if (result.status === "success") {
            showNotification('Absensi berhasil disubmit!', false);
            form.reset();
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        showNotification(`Error: ${error.message}`, true);
        console.error("Error submitting attendance: ", error);
    } finally {
        submitButton.disabled = false;
    }
});


// Logika Form Logbook
document.getElementById('logbookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    showNotification('Menyimpan logbook...', false);
    
    try {
        const pesertaData = JSON.parse(localStorage.getItem('pesertaData'));
        const dataToSend = {
            type: "logbook",
            nama: pesertaData.nama,
            nim: pesertaData.nim,
            aktivitas: document.getElementById('aktivitas').value
        };

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(dataToSend),
             headers: {
                'Content-Type': 'application/json',
            },
        });
        
        const result = await response.json();
        if (result.status === "success") {
            showNotification('Logbook berhasil disimpan!', false);
            form.reset();
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        showNotification(`Error: ${error.message}`, true);
    } finally {
        submitButton.disabled = false;
    }
});
