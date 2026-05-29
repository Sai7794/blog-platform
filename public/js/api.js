const API_URL = '';

// LocalStorage helpers for auth
const getAuthToken = () => localStorage.getItem('blog_token');
const setAuthToken = (token) => localStorage.setItem('blog_token', token);
const removeAuthToken = () => localStorage.removeItem('blog_token');
const setUserData = (user) => localStorage.setItem('blog_user', JSON.stringify(user));
const getUserData = () => {
  const user = localStorage.getItem('blog_user');
  return user ? JSON.parse(user) : null;
};
const removeUserData = () => localStorage.removeItem('blog_user');

// Show toast notifications
const showToast = (message, type = 'success') => {
  const container = document.getElementById('toast-container');
  if (!container) {
    const newContainer = document.createElement('div');
    newContainer.id = 'toast-container';
    newContainer.className = 'toast-container';
    document.body.appendChild(newContainer);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  
  document.getElementById('toast-container').appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Generic API caller with JWT header inclusion
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
};

// Auth API helpers
const authAPI = {
  register: async (name, email, password) => {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (data.token) {
      setAuthToken(data.token);
      setUserData({ _id: data._id, name: data.name, email: data.email });
    }
    return data;
  },
  
  login: async (email, password) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      setAuthToken(data.token);
      setUserData({ _id: data._id, name: data.name, email: data.email });
    }
    return data;
  },
  
  logout: () => {
    removeAuthToken();
    removeUserData();
    showToast('Logged out successfully');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  },
  
  getCurrentUser: async () => {
    try {
      const data = await apiRequest('/api/auth/me');
      if (data.success) {
        setUserData(data);
        return data;
      }
    } catch (err) {
      removeAuthToken();
      removeUserData();
      return null;
    }
  },
  
  isAuthenticated: () => {
    return !!getAuthToken();
  }
};

// Posts API helpers
const postsAPI = {
  getAll: async () => {
    return await apiRequest('/api/posts');
  },
  
  getOne: async (id) => {
    return await apiRequest(`/api/posts/${id}`);
  },
  
  create: async (postData) => {
    return await apiRequest('/api/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },
  
  update: async (id, postData) => {
    return await apiRequest(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  },
  
  delete: async (id) => {
    return await apiRequest(`/api/posts/${id}`, {
      method: 'DELETE',
    });
  }
};

// Comments API helpers
const commentsAPI = {
  getByPost: async (postId) => {
    return await apiRequest(`/api/comments/post/${postId}`);
  },
  
  add: async (postId, content) => {
    return await apiRequest(`/api/comments/post/${postId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
  
  delete: async (id) => {
    return await apiRequest(`/api/comments/${id}`, {
      method: 'DELETE',
    });
  }
};

// Format date utility
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Common navigation renderer helper
const renderNavigation = () => {
  const navContainer = document.getElementById('navbar-auth-links');
  if (!navContainer) return;
  
  const isLoggedIn = authAPI.isAuthenticated();
  const user = getUserData();
  
  if (isLoggedIn && user) {
    navContainer.innerHTML = `
      <li><a href="index.html" class="nav-link">Home</a></li>
      <li><a href="create-post.html" class="nav-link">Write Post</a></li>
      <li><span class="nav-link" style="color: #ffffff;">Hello, <strong>${user.name}</strong></span></li>
      <li><button onclick="authAPI.logout()" class="btn btn-secondary">Logout</button></li>
    `;
  } else {
    navContainer.innerHTML = `
      <li><a href="index.html" class="nav-link">Home</a></li>
      <li><a href="login.html" class="btn btn-secondary">Login</a></li>
      <li><a href="register.html" class="btn btn-primary">Sign Up</a></li>
    `;
  }
};

// Check navbar active state links
const highlightActiveLink = () => {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
};

// Automatically run on page load
document.addEventListener('DOMContentLoaded', () => {
  renderNavigation();
  highlightActiveLink();
});
