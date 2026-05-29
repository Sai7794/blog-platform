// Get post ID from URL parameters
const getPostIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
};

const postId = getPostIdFromUrl();
let currentPost = null;

// DOM Elements
const postTitle = document.getElementById('post-title');
const postAuthor = document.getElementById('post-author');
const postDate = document.getElementById('post-date');
const postBanner = document.getElementById('post-banner');
const postBody = document.getElementById('post-body');
const postTags = document.getElementById('post-tags');
const postActions = document.getElementById('post-actions');

const commentsCount = document.getElementById('comments-count');
const commentForm = document.getElementById('comment-form');
const commentInput = document.getElementById('comment-input');
const commentsList = document.getElementById('comments-list');
const commentFormContainer = document.getElementById('comment-form-container');

// Fetch and display post details
const loadPostDetail = async () => {
  if (!postId) {
    showToast('No post ID specified', 'error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
    return;
  }

  try {
    const res = await postsAPI.getOne(postId);
    if (res.success) {
      currentPost = res.data;
      renderPostDetails(currentPost);
      loadComments();
    }
  } catch (error) {
    showToast('Failed to load post details: ' + error.message, 'error');
    if (postBody) {
      postBody.innerHTML = `<p style="color: var(--danger); text-align: center;">Error loading post: ${error.message}</p>`;
    }
  }
};

// Render post page fields
const renderPostDetails = (post) => {
  if (postTitle) postTitle.innerText = post.title;
  if (postAuthor) postAuthor.innerText = post.author ? post.author.name : 'Anonymous';
  if (postDate) postDate.innerText = formatDate(post.createdAt);
  
  if (postBanner) {
    if (post.coverImage) {
      postBanner.src = post.coverImage;
      postBanner.style.display = 'block';
    } else {
      postBanner.style.display = 'none';
    }
  }
  
  if (postBody) {
    // Process markdown-like linebreaks into paragraphs
    const paragraphs = post.content
      .split('\n\n')
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');
    postBody.innerHTML = paragraphs;
  }

  if (postTags && post.tags) {
    postTags.innerHTML = post.tags.map(t => `<span class="filter-tag active" style="pointer-events: none;">${t}</span>`).join('');
  }

  // Render Edit/Delete actions if current user is the author
  const currentUser = getUserData();
  if (postActions && currentUser && post.author && currentUser._id === post.author._id) {
    postActions.innerHTML = `
      <a href="create-post.html?edit=true&id=${post._id}" class="btn btn-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
        </svg>
        Edit Post
      </a>
      <button id="delete-post-btn" class="btn btn-danger">
        <svg xmlns="http://www.w3.org/2000/svg" style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
        Delete Post
      </button>
    `;

    document.getElementById('delete-post-btn').addEventListener('click', deletePostHandler);
  }
};

// Delete Post
const deletePostHandler = async () => {
  if (confirm('Are you absolutely sure you want to delete this post and all its comments? This action cannot be undone.')) {
    try {
      const res = await postsAPI.delete(postId);
      if (res.success) {
        showToast('Post deleted successfully');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      }
    } catch (error) {
      showToast('Failed to delete post: ' + error.message, 'error');
    }
  }
};

// Fetch and render comments
const loadComments = async () => {
  if (!commentsList) return;

  // Manage comment submission box visibility depending on Auth
  const isLoggedIn = authAPI.isAuthenticated();
  if (commentFormContainer) {
    if (isLoggedIn) {
      commentFormContainer.style.display = 'block';
    } else {
      commentFormContainer.style.display = 'block';
      commentFormContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-muted);">
          Please <a href="login.html" style="color: var(--primary); font-weight: 600;">log in</a> or <a href="register.html" style="color: var(--primary); font-weight: 600;">sign up</a> to join the conversation and comment!
        </div>
      `;
    }
  }

  try {
    const res = await commentsAPI.getByPost(postId);
    if (res.success) {
      const comments = res.data;
      if (commentsCount) commentsCount.innerText = comments.length;
      renderCommentsList(comments);
    }
  } catch (error) {
    showToast('Failed to load comments: ' + error.message, 'error');
  }
};

// Render comments DOM list
const renderCommentsList = (comments) => {
  if (!commentsList) return;

  if (comments.length === 0) {
    commentsList.innerHTML = `<p style="text-align: center; padding: 20px; color: var(--text-muted);">No comments yet. Be the first to express your thoughts!</p>`;
    return;
  }

  const currentUser = getUserData();
  const postAuthorId = currentPost && currentPost.author ? currentPost.author._id : null;

  commentsList.innerHTML = comments.map(comment => {
    const authorName = comment.author ? comment.author.name : 'Anonymous';
    const authorInitials = authorName.charAt(0).toUpperCase();
    
    // Check if user is the comment author OR the post author (they can delete comment)
    const canDelete = currentUser && (
      currentUser._id === comment.author._id || 
      currentUser._id === postAuthorId
    );

    const deleteBtnHtml = canDelete 
      ? `
        <button class="btn btn-danger delete-comment-btn" data-comment-id="${comment._id}" style="padding: 4px 8px; font-size: 11px;">
          Delete
        </button>
      `
      : '';

    return `
      <div class="comment-card glass">
        <div class="avatar">${authorInitials}</div>
        <div class="comment-body-wrapper">
          <div class="comment-header">
            <div class="comment-author-info">
              <span class="comment-author-name">${authorName}</span>
              <span class="comment-date">${formatDate(comment.createdAt)}</span>
            </div>
            ${deleteBtnHtml}
          </div>
          <div class="comment-content">${comment.content}</div>
        </div>
      </div>
    `;
  }).join('');

  // Add click listeners to delete comment buttons
  document.querySelectorAll('.delete-comment-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const cId = e.target.getAttribute('data-comment-id');
      if (confirm('Delete this comment?')) {
        try {
          const res = await commentsAPI.delete(cId);
          if (res.success) {
            showToast('Comment deleted');
            loadComments();
          }
        } catch (error) {
          showToast('Failed to delete comment: ' + error.message, 'error');
        }
      }
    });
  });
};

// Add Comment Handler
if (commentForm) {
  commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = commentInput.value.trim();
    if (!content) return;

    try {
      const res = await commentsAPI.add(postId, content);
      if (res.success) {
        showToast('Comment added!');
        commentInput.value = '';
        loadComments();
      }
    } catch (error) {
      showToast('Failed to add comment: ' + error.message, 'error');
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadPostDetail();
});
