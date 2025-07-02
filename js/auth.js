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

// Logika untuk form "login" peserta
const pesertaForm = document.getElementById('pesertaLoginForm');
if (pesertaForm) {
    pesertaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nama = document.getElementById('nama').value;
        const nim = document.getElementById('nim').value;

        if (nama.trim() === '' || nim.trim() === '') {
            showNotification('Nama dan NIM tidak boleh kosong!', true);
            return;
        }

        // Simpan data di local storage browser
        const pesertaData = { nama: nama, nim: nim };
        localStorage.setItem('pesertaData', JSON.stringify(pesertaData));
        
        showNotification('Data tersimpan! Mengalihkan ke halaman absensi...', false);
        setTimeout(() => {
            window.location.href = 'peserta.html';
        }, 1500);
    });
}

// Logika untuk tombol login admin
const adminLoginBtn = document.getElementById('adminLoginBtn');
if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', () => {
        const password = prompt('Masukkan Kunci Akses Admin:');
        if (password) {
            // Simpan kunci di session storage agar bisa digunakan di halaman admin
            sessionStorage.setItem('adminKey', password);
            window.location.href = 'admin.html';
        }
    });
}
