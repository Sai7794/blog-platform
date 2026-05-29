// Ensure authenticated access
if (!authAPI.isAuthenticated()) {
  showToast('You must be logged in to access this page', 'error');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1000);
}

const params = new URLSearchParams(window.location.search);
const isEdit = params.get('edit') === 'true';
const postId = params.get('id');

const pageTitle = document.getElementById('page-title');
const submitBtn = document.getElementById('submit-btn');
const postForm = document.getElementById('post-form');

const titleInput = document.getElementById('post-title-input');
const coverInput = document.getElementById('post-cover-input');
const tagsInput = document.getElementById('post-tags-input');
const contentInput = document.getElementById('post-content-input');

// Pre-fill form if editing
const prefillForm = async () => {
  if (!isEdit || !postId) return;

  if (pageTitle) pageTitle.innerText = 'Edit Post';
  if (submitBtn) submitBtn.innerText = 'Update Post';

  try {
    const res = await postsAPI.getOne(postId);
    if (res.success) {
      const post = res.data;
      
      // Make sure the current logged in user is the author
      const currentUser = getUserData();
      if (post.author && currentUser._id !== post.author._id) {
        showToast('Not authorized to edit this post', 'error');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
        return;
      }

      if (titleInput) titleInput.value = post.title || '';
      if (coverInput) coverInput.value = post.coverImage || '';
      if (tagsInput) tagsInput.value = (post.tags && post.tags.join(', ')) || '';
      if (contentInput) contentInput.value = post.content || '';
    }
  } catch (error) {
    showToast('Failed to load post for editing: ' + error.message, 'error');
  }
};

// Handle Form Submission
if (postForm) {
  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const coverImage = coverInput.value.trim();
    const tags = tagsInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
      showToast('Title and content are required', 'error');
      return;
    }

    const payload = {
      title,
      coverImage,
      tags,
      content
    };

    try {
      let res;
      if (isEdit && postId) {
        res = await postsAPI.update(postId, payload);
        if (res.success) {
          showToast('Post updated successfully!');
          setTimeout(() => {
            window.location.href = `post.html?id=${postId}`;
          }, 1500);
        }
      } else {
        res = await postsAPI.create(payload);
        if (res.success) {
          showToast('Post created successfully!');
          setTimeout(() => {
            window.location.href = `post.html?id=${res.data._id}`;
          }, 1500);
        }
      }
    } catch (error) {
      showToast('Operation failed: ' + error.message, 'error');
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  prefillForm();
});
