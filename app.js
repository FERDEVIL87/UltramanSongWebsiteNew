// 1. FUNGSI UNTUK MEMBACA FILE CSV DAN MEMBUAT LIST
function loadCSVData(csvFileUrl, containerId, limit = null) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', csvFileUrl, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const csvText = xhr.responseText;
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    let data = results.data;
                    if (limit) {
                        data = data.slice(0, limit); // Ambil hanya limit pertama (untuk home)
                    }
                    renderList(data, containerId);
                },
                error: function(err) {
                    console.error("Gagal membaca file " + csvFileUrl, err);
                }
            });
        }
    };
    xhr.send();
}
// 2. FUNGSI MERENDER DATA KE HTML (TANPA GAMBAR)
function renderList(data, containerId, isRow = false) {
    const container = document.getElementById(containerId);
    let htmlContent = '';
    data.forEach(item => {
        if(item.Judul && item.Link_Embed) {
            // Encode data agar aman dilempar ke dalam fungsi onClick
            const itemDataString = encodeURIComponent(JSON.stringify(item));
            // Ambil info nama artisnya saja untuk ditampilkan di depan
            const artistName = item.Info_Detail ? item.Info_Detail.split('|')[0] : "";
            if (isRow) {
                htmlContent += `
                    <div class="song-list-item row">
                        <div class="left">
                            <span class="song-list-item-title">${item.Judul}</span>
                            <p class="song-list-item-desc">${artistName}</p>
                        </div>
                        <button class="song-list-item-button" data-item="${itemDataString}">
                            <i class="fa-solid fa-play"></i> Watch
                        </button>
                    </div>
                `;
            } else {
                htmlContent += `
                    <div class="song-list-item no-image">
                        <span class="song-list-item-title">${item.Judul}</span>
                        <p class="song-list-item-desc">${artistName}</p> 
                        <button class="song-list-item-button" data-item="${itemDataString}">
                            <i class="fa-solid fa-play"></i> Watch
                        </button>
                    </div>
                `;
            }
        }
    });
    container.innerHTML = htmlContent;
    if (containerId !== 'showa-all-list' && containerId !== 'heisei-all-list' && containerId !== 'reiwa-all-list') {
        initSliders(); // Panggil slider hanya untuk home sections
    }
}
// 3. JALANKAN PEMBACAAN 3 DATABASE (Hanya Nama CSV dan ID Target) - UNTUK HOME (5 TERBARU)
loadCSVData('database_ultraman_showa.csv', 'showa-list', 5);
loadCSVData('database_ultraman_heisei.csv', 'heisei-list', 5);
loadCSVData('database_ultraman_reiwa.csv', 'reiwa-list', 5);
// 4. LOAD SEMUA DATA UNTUK ALL SONGS
let showaData = [];
let heiseiData = [];
let reiwaData = [];
function loadAllSongs() {
    const promises = [
        fetchCSV('database_ultraman_showa.csv'),
        fetchCSV('database_ultraman_heisei.csv'),
        fetchCSV('database_ultraman_reiwa.csv')
    ];
    Promise.all(promises).then(results => {
        showaData = results[0].data;
        heiseiData = results[1].data;
        reiwaData = results[2].data;
        renderList(showaData, 'showa-all-list', true);
    });
}
function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const csvText = xhr.responseText;
                    Papa.parse(csvText, {
                        header: true,
                        skipEmptyLines: true,
                        complete: resolve,
                        error: reject
                    });
                } else {
                    reject(new Error('Failed to load ' + url));
                }
            }
        };
        xhr.send();
    });
}
loadAllSongs();
// 5. FUNGSI TAB
function showTab(evt, tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const menuItems = document.querySelectorAll('.menu-list-item');
    tabs.forEach(tab => tab.classList.remove('active'));
    menuItems.forEach(item => item.classList.remove('active'));
    document.getElementById(tabName + '-tab').classList.add('active');
    evt.currentTarget.classList.add('active');
}
function showSubTab(evt, subTabName) {
    const subTabs = document.querySelectorAll('.sub-tab-content');
    const subTabButtons = document.querySelectorAll('.sub-tab');
    subTabs.forEach(tab => tab.classList.remove('active'));
    subTabButtons.forEach(btn => btn.classList.remove('active'));
    document.getElementById(subTabName).classList.add('active');
    evt.currentTarget.classList.add('active');
    // Render data berdasarkan sub-tab
    if (subTabName === 'showa-all') {
        renderList(showaData, 'showa-all-list', true);
    } else if (subTabName === 'heisei-all') {
        renderList(heiseiData, 'heisei-all-list', true);
    } else if (subTabName === 'reiwa-all') {
        renderList(reiwaData, 'reiwa-all-list', true);
    }
}
// 6. FUNGSI SEARCH
function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const activeSubTab = document.querySelector('.sub-tab-content.active').id;
    let data;
    let containerId;
    if (activeSubTab === 'showa-all') {
        data = showaData;
        containerId = 'showa-all-list';
    } else if (activeSubTab === 'heisei-all') {
        data = heiseiData;
        containerId = 'heisei-all-list';
    } else if (activeSubTab === 'reiwa-all') {
        data = reiwaData;
        containerId = 'reiwa-all-list';
    }
    const filteredData = data.filter(item => {
        const title = item.Judul ? item.Judul.toLowerCase() : '';
        const detail = item.Info_Detail ? item.Info_Detail.toLowerCase() : '';
        return title.includes(query) || detail.includes(query);
    });
    renderList(filteredData, containerId, true);
}
document.getElementById('search-input').addEventListener('input', performSearch);
document.getElementById('search-button').addEventListener('click', performSearch);
// 7. LOGIKA POP-UP (MODAL)
const modal = document.getElementById("videoModal");
const closeBtn = document.querySelector(".close-btn");
function openModal(dataString) {
    const item = JSON.parse(decodeURIComponent(dataString));
    document.getElementById("modal-title").innerText = item.Judul;
    document.getElementById("modal-detail").innerText = item.Info_Detail;
    document.getElementById("modal-desc").innerText = item.Deskripsi;
    const lirikContainer = document.getElementById('modal-lirik');

    if (item.Lirik && item.Lirik.trim() !== "") {
        lirikContainer.textContent = item.Lirik;
        lirikContainer.style.display = "block";
    } else {
        lirikContainer.textContent = "";
        lirikContainer.style.display = "none";
    }

    const iframeContainer = document.getElementById("modal-iframe-container");
    iframeContainer.innerHTML = `<iframe src="${item.Link_Embed}" frameborder="0" allowfullscreen></iframe>`;
    modal.style.display = "block";
}
function closeModal() {
    modal.style.display = "none";
    document.getElementById("modal-iframe-container").innerHTML = ''; 
}
closeBtn.addEventListener("click", closeModal);
window.addEventListener("click", function(event) {
    if (event.target == modal) {
        closeModal();
    }
});
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}
// 5. SLIDER LOGIC (GESER HORIZONTAL) & DARK MODE
function initSliders() {
    const arrows = document.querySelectorAll(".arrow");
    const songLists = document.querySelectorAll(".song-list");
    arrows.forEach((arrow, i) => {
        let newArrow = arrow.cloneNode(true);
        arrow.parentNode.replaceChild(newArrow, arrow);
        // Sesuaikan perhitungan item karena gambar dihapus
        const itemNum = songLists[i].querySelectorAll(".song-list-item").length;
        let clickCounter = 0;
        newArrow.addEventListener("click", () => {
            const ratio = Math.floor(window.innerWidth / 270);
            clickCounter++;
            if (itemNum - (4 + clickCounter) + (5.5 - ratio) >= 0) {
                let transformValue = getComputedStyle(songLists[i]).transform;
                let currentX = transformValue !== 'none' ? parseInt(transformValue.split(',')[4]) : 0;
                songLists[i].style.transform = `translateX(${currentX - 300}px)`;
            } else {
                songLists[i].style.transform = "translateX(0)";
                clickCounter = 0;
            }
        });
    });
}
// Theme Toggle
const themeToggle = document.querySelector('.toggle');
const themeBall = document.querySelector('.toggle-ball');
const storedTheme = localStorage.getItem('ultraman-theme');
if (storedTheme === 'light') {
    document.body.classList.add('light-mode');
    themeBall.classList.add('active');
}

themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    themeBall.classList.toggle('active', isLight);
    localStorage.setItem('ultraman-theme', isLight ? 'light' : 'dark');
});

// Event delegation for Watch buttons
document.addEventListener('click', function(e) {
    if (e.target.closest('.song-list-item-button')) {
        const button = e.target.closest('.song-list-item-button');
        const dataString = button.getAttribute('data-item');
        openModal(dataString);
    }
});
