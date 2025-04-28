// script.js

// Global Elements
const excitementSlider = document.getElementById('excitement');
const excitementValue = document.getElementById('excitementValue');
const movieList = document.getElementById('movieList');
const favoriteList = document.getElementById('favoriteList');
const filmForm = document.getElementById('filmForm');
const previewBox = document.getElementById('previewBox');
const previewNama = document.getElementById('previewnama');
const previewEmail = document.getElementById('previewEmail');
const previewGenre = document.getElementById('previewGenre');
const previewExcitement = document.getElementById('previewExcitement');
const confirmBtn = document.getElementById('confirmBtn');

const genreMap = {
  action: 28,
  thriller: 53,
  animation: 16,
  romance: 10749,
  comedy: 35
};

window.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("themeToggle");
  const label = document.getElementById("modeLabel");

  // Theme setup
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);

  if (isDark) document.body.classList.add("dark-mode");
  setThemeIcon(isDark);

  toggleBtn.addEventListener("click", () => {
    const isDarkMode = document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    setThemeIcon(isDarkMode);
  });

  // Load saved form & favorites
  const savedNama = localStorage.getItem("nama");
  const savedEmail = localStorage.getItem("email");
  const savedGenre = JSON.parse(localStorage.getItem("genre") || "[]");
  const savedExcitement = localStorage.getItem("excitement");
  const savedFavs = JSON.parse(localStorage.getItem("favorites") || "[]");

  if (savedNama) document.getElementById("nama").value = savedNama;
  if (savedEmail) document.getElementById("email").value = savedEmail;
  if (savedGenre.length) {
    const genreInput = document.getElementById("genre");
    Array.from(genreInput.options).forEach(opt => {
      if (savedGenre.includes(opt.value)) opt.selected = true;
    });
  }
  if (savedExcitement) {
    excitementSlider.value = savedExcitement;
    excitementValue.textContent = savedExcitement;
  }
  renderFavorites(savedFavs);

  // Search bar listener
  const searchInput = document.getElementById('searchInput');

  searchInput.addEventListener('keydown', async e => {
    if (e.key === 'Enter') {
      e.preventDefault(); // hindari reload
      const q = searchInput.value.trim();
      if (q.length >= 3) {
        await searchMovies(q); // search baru dijalankan di sini
        document.getElementById('recommendations').scrollIntoView({ behavior: 'smooth' });
      }
    }
  });  

// Tetap ada event input biasa buat real-time cari (tanpa scroll)
searchInput.addEventListener('input', e => {
  const q = e.target.value.trim();
  const recommendations = document.getElementById('recommendations');
  
  if (q.length >= 3) {
    recommendations.style.display = 'block';
    // TIDAK LANGSUNG search, cukup tampilkan section doang
  } else {
    recommendations.style.display = 'none';
  }
});

  // Excitement slider
  excitementSlider.addEventListener('input', () => {
    excitementValue.textContent = excitementSlider.value;
  });
});

function setThemeIcon(isDark) {
  const toggleBtn = document.getElementById("themeToggle");
  const label = document.getElementById("modeLabel");
  toggleBtn.innerHTML = isDark
    ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-7.36l-1.42 1.42M6.05 17.95l-1.42 1.42M4.63 4.63l1.42 1.42M17.95 17.95l1.42 1.42M12 6a6 6 0 100 12 6 6 0 000-12z" /></svg>`;
  label.textContent = isDark ? "Dark Mode" : "Light Mode";
}

async function fetchMoviesByGenre(genres) {
  movieList.innerHTML = '';
  const ids = genres.map(g => genreMap[g.toLowerCase()]).filter(Boolean);
  if (!ids.length) return;
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=8653055a7956020303dda2bcb003624a&with_genres=${ids[0]}&sort_by=popularity.desc`;

  document.getElementById('loading').style.display = 'block'; // Munculkan loading

  try {
    const res = await fetch(url);
    const data = await res.json();
    renderMovies(data.results);
    document.getElementById('recommendations').style.display = 'block';
  } 
  catch {
    movieList.innerHTML = '<p style="text-align:center;">Failed to search for movies.</p>';
    showToast('Failed to search for movies.');
  }  
  finally {
    document.getElementById('loading').style.display = 'none'; // Sembunyikan loading
  }
}

async function searchMovies(query) {
  movieList.innerHTML = '';
  const url = `https://api.themoviedb.org/3/search/movie?api_key=8653055a7956020303dda2bcb003624a&query=${encodeURIComponent(query)}`;

  document.getElementById('loading').style.display = 'block'; // <-- show loading

  try {
    const res = await fetch(url);
    const data = await res.json();
    renderMovies(data.results);
    document.getElementById('recommendations').scrollIntoView({ behavior: 'smooth' });
  } 
  catch {
    movieList.innerHTML = '<p style="text-align:center;">No movies found.</p>';
    showToast('No movies found.');
  }   
  finally {
    document.getElementById('loading').style.display = 'none'; // <-- hide loading
  }
}

function renderMovies(movies) {
  movieList.innerHTML = '';

  if (movies.filter(m => m.vote_average >= 5.0).length === 0) {
    movieList.innerHTML = '<p style="text-align:center; font-style:italic;">No movies found.</p>';
    return;
  }

  movies.filter(m => m.vote_average >= 5.0).slice(0, 12).forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';

    const img = document.createElement('img');
    img.src = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : 'https://via.placeholder.com/300x450?text=No+Image';
    img.title = `${movie.title}`;
    card.appendChild(img);
    img.addEventListener('click', () => {
      openModal(movie);
    });    

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.innerText = `⭐ ${movie.vote_average} • ${movie.release_date?.slice(0, 4)}`;
    card.appendChild(tooltip);

    const title = document.createElement('h4');
    title.textContent = movie.title;
    card.appendChild(title);

    const rating = document.createElement('span');
    rating.textContent = `Rating: ${movie.vote_average}/10`;
    card.appendChild(rating);

    const favBtn = document.createElement('button');
    favBtn.className = 'fav-btn';
    favBtn.innerHTML = '♡';
    favBtn.setAttribute('aria-label', 'Favoritkan');
    favBtn.onclick = () => {
      addToFavorites(movie);
      favBtn.innerHTML = '♥';
      favBtn.classList.add('active');
      showToast('Added to favorites!');
    };
    card.appendChild(favBtn);

    movieList.appendChild(card);
  });
}

function addToFavorites(movie) {
  const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
  if (!saved.some(f => f.id === movie.id)) {
    saved.push({
      id: movie.id,
      title: movie.title,
      poster: movie.poster_path
    });
    localStorage.setItem("favorites", JSON.stringify(saved));
    renderFavorites(saved);
  }
}

function renderFavorites(favs) {
  favoriteList.innerHTML = '';
  const favSection = document.getElementById('favorites');
  if (!favs.length) {
    favSection.style.display = 'none';
    return;
  }
  favSection.style.display = 'block';

  favs.forEach(f => {
    const li = document.createElement('li');
    const thumb = document.createElement('div');
    thumb.className = 'fav-thumb';

    const img = document.createElement('img');
    img.src = f.poster
      ? `https://image.tmdb.org/t/p/w154${f.poster}`
      : 'https://via.placeholder.com/100x150?text=No+Image';
    img.alt = f.title;
    thumb.appendChild(img);

    const span = document.createElement('span');
    span.textContent = f.title;
    thumb.appendChild(span);

    li.appendChild(thumb);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-fav';
    removeBtn.innerText = '✖';
    removeBtn.onclick = () => {
      const updated = favs.filter(item => item.id !== f.id);
      localStorage.setItem("favorites", JSON.stringify(updated));
      renderFavorites(updated);
      showToast('Removed from favorites!');
    };
    li.appendChild(removeBtn);

    favoriteList.appendChild(li);
  });
}

// Submit form
filmForm.addEventListener('submit', async e => {
  e.preventDefault();
  const nama = document.getElementById('nama').value.trim();
  const email = document.getElementById('email').value.trim();
  const genre = Array.from(document.getElementById('genre').selectedOptions).map(o => o.value);
  const excitement = excitementSlider.value;

  if (nama.length < 2) {
    showToast('Name must be at least 2 characters long.'); return;
  }
  const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
  if (!emailPattern.test(email)) {
    showToast('Invalid email format'); return;
  }
  if (genre.length === 0) {
    showToast('Please select at least one favorite genre!');
    return;
  }

  // simpan dan tampil preview
  localStorage.setItem("nama", nama);
  localStorage.setItem("email", email);
  localStorage.setItem("genre", JSON.stringify(genre));
  localStorage.setItem("excitement", excitement);

  previewNama.textContent = nama;
  previewEmail.textContent = email;
  previewGenre.textContent = genre.join(', ');
  previewExcitement.textContent = excitement;
  showToast('Form submitted successfully!');
  previewBox.style.display = 'block';
  previewBox.scrollIntoView({ behavior: 'smooth' });
  await fetchMoviesByGenre(genre);
});

confirmBtn.addEventListener('click', () => {
  showToast('Thank you! Your data has been submitted.');
  previewBox.style.display = 'none';
  filmForm.reset();
  localStorage.clear();
});

function openModal(movie) {
  const modal = document.getElementById('modalDetail');
  const modalTitle = document.getElementById('modalTitle');
  const modalPoster = document.getElementById('modalPoster');
  const modalOverview = document.getElementById('modalOverview');

  modalTitle.textContent = movie.title;
  modalPoster.src = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/300x450?text=No+Image';
  modalOverview.textContent = movie.overview ? movie.overview : "Synopsis not available.";

  modal.style.display = 'block';
}

// Close Modal
const closeModal = document.getElementById('closeModal');
closeModal.addEventListener('click', () => {
  document.getElementById('modalDetail').style.display = 'none';
});

// Klik di luar modal untuk close
window.addEventListener('click', (e) => {
  const modal = document.getElementById('modalDetail');
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// Fungsi buat munculin toast mini
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000); // ilang setelah 2 detik
}


