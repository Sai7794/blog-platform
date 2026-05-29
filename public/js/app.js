let allPosts = [];
let selectedTag = '';
let searchQuery = '';

const postsGrid = document.getElementById('posts-grid');
const searchInput = document.getElementById('search-input');
const tagsFilterContainer = document.getElementById('tags-filter');

// Fetch and render posts
const fetchAndRenderPosts = async () => {
  if (!postsGrid) return;
  
  postsGrid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
      <svg class="animate-spin" style="width: 32px; height: 32px; margin: 0 auto 16px auto; display: block; stroke: var(--primary);" fill="none" viewBox="0 0 24 24">
        <circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading awesome posts...
    </div>
  `;

  try {
    const res = await postsAPI.getAll();
    if (res.success) {
      allPosts = res.data;
      renderTagsFilter();
      filterAndRenderPosts();
    }
  } catch (error) {
    showToast('Failed to load posts: ' + error.message, 'error');
    postsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--danger);">
        Error loading posts. Please try again later.
      </div>
    `;
  }
};

// Render tag filter buttons
const renderTagsFilter = () => {
  if (!tagsFilterContainer) return;

  // Extract all unique tags
  const tagsSet = new Set();
  allPosts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => tagsSet.add(tag.trim()));
    }
  });

  const tags = ['All', ...Array.from(tagsSet)];
  
  tagsFilterContainer.innerHTML = tags.map(tag => {
    const isActive = (tag === 'All' && !selectedTag) || (selectedTag === tag);
    return `
      <button class="filter-tag ${isActive ? 'active' : ''}" data-tag="${tag === 'All' ? '' : tag}">
        ${tag}
      </button>
    `;
  }).join('');

  // Add click listeners to tags
  document.querySelectorAll('.filter-tag').forEach(button => {
    button.addEventListener('click', (e) => {
      selectedTag = e.target.getAttribute('data-tag');
      
      // Update UI active states
      document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      filterAndRenderPosts();
    });
  });
};

// Filter posts and render them
const filterAndRenderPosts = () => {
  if (!postsGrid) return;

  let filtered = allPosts;

  // Tag filter
  if (selectedTag) {
    filtered = filtered.filter(post => post.tags && post.tags.includes(selectedTag));
  }

  // Search query filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(post => 
      post.title.toLowerCase().includes(q) || 
      post.content.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    postsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 40px; color: var(--text-muted);" class="glass">
        <svg xmlns="http://www.w3.org/2000/svg" style="width: 48px; height: 48px; margin: 0 auto 16px auto; stroke: var(--text-muted); opacity: 0.5;" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <h3>No posts found</h3>
        <p style="margin-top: 8px;">Try adjusting your search or select another category filter.</p>
      </div>
    `;
    return;
  }

  postsGrid.innerHTML = filtered.map(post => {
    const authorName = post.author ? post.author.name : 'Anonymous';
    const authorInitials = authorName.charAt(0).toUpperCase();
    const coverImg = post.coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=600&auto=format&fit=crop';
    
    // Create excerpt
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = post.content;
    const cleanExcerpt = tempDiv.textContent || tempDiv.innerText || '';
    
    const tagsHtml = post.tags && post.tags.length > 0 
      ? post.tags.map(t => `<span class="post-card-tag">${t}</span>`).join('')
      : '';

    return `
      <article class="post-card glass">
        <a href="post.html?id=${post._id}" class="post-img-wrapper">
          <img src="${coverImg}" alt="${post.title}" class="post-img" loading="lazy">
        </a>
        <div class="post-card-content">
          <div class="post-card-tags">${tagsHtml}</div>
          <a href="post.html?id=${post._id}">
            <h3 class="post-card-title">${post.title}</h3>
          </a>
          <p class="post-card-excerpt">${cleanExcerpt}</p>
          <div class="post-card-meta">
            <div class="author-info">
              <div class="avatar">${authorInitials}</div>
              <span>${authorName}</span>
            </div>
            <span>${formatDate(post.createdAt)}</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
};

// Event listeners for search input
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    filterAndRenderPosts();
  });
}

// Initial fetch on load
document.addEventListener('DOMContentLoaded', () => {
  fetchAndRenderPosts();
});
