const API_KEY = '1cf50e6248dc270629e802686245c2c8';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const IMG_BG_URL = 'https://image.tmdb.org/t/p/original';

// -- State --
let currentPage = 'home';
let searchPageNum = 1;
let currentSearchQuery = '';
let isFetching = false;

// -- DOM Elements --
const pages = {
  home: document.getElementById('page-home'),
  search: document.getElementById('page-search')
};
const navLinks = {
  home: document.getElementById('nav-home'),
  search: document.getElementById('nav-search')
};
const searchInput = document.getElementById('search-input');
const searchGrid = document.getElementById('search-grid');
const searchResultsSection = document.getElementById('search-results-section');
const loadMoreWrap = document.getElementById('load-more-wrap');
const searchEmpty = document.getElementById('search-empty');
const modalOverlay = document.getElementById('modal-overlay');
const modalInner = document.getElementById('modal-inner');
const toastEl = document.getElementById('toast');
const navbar = document.getElementById('navbar');

// -- Initialize --
document.addEventListener('DOMContentLoaded', () => {
  initHome();
  
  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Search input enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });
});

// -- Navigation --
function showPage(pageId) {
  currentPage = pageId;
  window.scrollTo(0, 0);
  
  // Update nav UI
  Object.values(navLinks).forEach(link => link.classList.remove('active'));
  navLinks[pageId].classList.add('active');
  
  // Update pages
  Object.values(pages).forEach(page => page.classList.remove('active'));
  pages[pageId].classList.add('active');

  if (pageId === 'search') {
    setTimeout(() => searchInput.focus(), 100);
  }
}

// -- Fetch Helpers --
async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    showToast('Failed to fetch data. Please try again.');
    return null;
  }
}

// -- Home Page Logic --
async function initHome() {
  // Fetch Trending
  const trendingData = await fetchAPI(`/trending/movie/week?api_key=${API_KEY}`);
  if (trendingData && trendingData.results) {
    const movies = trendingData.results;
    if (movies.length > 0) {
      setupHero(movies[0]); // First movie for hero
      renderMovies(movies.slice(1, 13), 'trending-grid');
    }
  }

  // Fetch Popular
  const popularData = await fetchAPI(`/movie/popular?api_key=${API_KEY}&page=1`);
  if (popularData && popularData.results) {
    renderMovies(popularData.results.slice(0, 12), 'popular-grid');
  }
}

function setupHero(movie) {
  document.getElementById('hero-title').textContent = movie.title;
  document.getElementById('hero-overview').textContent = movie.overview;
  
  const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';
  
  document.getElementById('hero-meta').innerHTML = `
    <span>${year}</span>
    <span class="rating">★ ${rating}</span>
  `;

  document.getElementById('hero-bg').style.backgroundImage = `url(${IMG_BG_URL}${movie.backdrop_path})`;
  
  const heroBtn = document.getElementById('hero-details-btn');
  heroBtn.onclick = () => openModal(movie.id);
}

// -- Search Logic --
async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  currentSearchQuery = query;
  searchPageNum = 1;
  searchGrid.innerHTML = '';
  
  searchEmpty.style.display = 'none';
  searchResultsSection.style.display = 'block';
  loadMoreWrap.style.display = 'none';
  document.getElementById('results-title').textContent = `Results for "${query}"`;
  
  showToast('Searching...');
  await fetchSearchResults();
}

async function loadMoreResults() {
  if (isFetching) return;
  searchPageNum++;
  await fetchSearchResults();
}

async function fetchSearchResults() {
  isFetching = true;
  const data = await fetchAPI(`/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(currentSearchQuery)}&page=${searchPageNum}`);
  
  if (data && data.results) {
    if (data.results.length === 0 && searchPageNum === 1) {
      searchResultsSection.style.display = 'none';
      searchEmpty.style.display = 'block';
      searchEmpty.querySelector('h3').textContent = 'No results found';
      searchEmpty.querySelector('p').textContent = 'Try adjusting your search terms';
    } else {
      appendMovies(data.results, 'search-grid');
      loadMoreWrap.style.display = data.page < data.total_pages ? 'block' : 'none';
    }
  }
  isFetching = false;
}

// -- Rendering Movies --
function createMovieCard(movie) {
  const card = document.createElement('div');
  card.className = 'movie-card';
  card.onclick = () => openModal(movie.id);

  const posterSrc = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : null;
  const posterHtml = posterSrc 
    ? `<img src="${posterSrc}" alt="${movie.title}" class="poster" loading="lazy" />`
    : `<div class="no-poster">🎬</div>`;

  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';
  const year = movie.release_date ? movie.release_date.split('-')[0] : '';

  card.innerHTML = `
    <div class="poster-wrap">
      ${posterHtml}
      <div class="card-rating">★ ${rating}</div>
      <div class="poster-overlay"></div>
    </div>
    <div class="card-info">
      <h3 class="card-title" title="${movie.title}">${movie.title}</h3>
      <div class="card-year">${year}</div>
    </div>
  `;
  return card;
}

function renderMovies(movies, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  appendMovies(movies, containerId);
}

function appendMovies(movies, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  movies.forEach(movie => {
    // Only show movies that have a poster or some valid data to look clean
    container.appendChild(createMovieCard(movie));
  });
}

// -- Movie Modal --
async function openModal(movieId) {
  modalOverlay.classList.add('open');
  modalInner.innerHTML = `<div style="padding: 40px; text-align: center;">Loading...</div>`;
  
  const movie = await fetchAPI(`/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`);
  
  if (!movie) {
    modalInner.innerHTML = `<div style="padding: 40px; text-align: center;">Error loading details.</div>`;
    return;
  }

  const backdropSrc = movie.backdrop_path ? `${IMG_BG_URL}${movie.backdrop_path}` : null;
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';
  const runtime = movie.runtime ? `${movie.runtime} min` : 'N/A';
  const genres = movie.genres.map(g => `<span class="modal-tag">${g.name}</span>`).join('');
  
  let cast = 'N/A';
  if (movie.credits && movie.credits.cast) {
    cast = movie.credits.cast.slice(0, 4).map(c => c.name).join(', ');
  }

  const formatCurrency = (amount) => amount ? `$${amount.toLocaleString()}` : 'N/A';

  modalInner.innerHTML = `
    ${backdropSrc ? `<img src="${backdropSrc}" class="modal-backdrop" alt="Backdrop" />` : ''}
    <div class="modal-body">
      <h2 class="modal-title">${movie.title}</h2>
      <div class="modal-meta">
        <span class="modal-tag rating">★ ${rating}</span>
        <span class="modal-tag">${runtime}</span>
        <span class="modal-tag">${movie.release_date || 'N/A'}</span>
        ${genres}
      </div>
      <p class="modal-overview">${movie.overview || 'No overview available.'}</p>
      
      <div class="modal-stats">
        <div class="modal-stat">
          <label>Status</label>
          <span>${movie.status || 'N/A'}</span>
        </div>
        <div class="modal-stat">
          <label>Budget</label>
          <span>${formatCurrency(movie.budget)}</span>
        </div>
        <div class="modal-stat">
          <label>Revenue</label>
          <span>${formatCurrency(movie.revenue)}</span>
        </div>
        <div class="modal-stat" style="grid-column: 1 / -1;">
          <label>Top Cast</label>
          <span style="font-size: 0.95rem; font-weight: 500;">${cast}</span>
        </div>
      </div>
    </div>
  `;
}

function closeModal() {
  modalOverlay.classList.remove('open');
  // Clear after transition
  setTimeout(() => {
    if (!modalOverlay.classList.contains('open')) {
      modalInner.innerHTML = '';
    }
  }, 350);
}

// -- Toast Notification --
let toastTimeout;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}
