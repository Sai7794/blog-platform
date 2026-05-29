// Redirect authenticated users away from login/register pages
if (authAPI.isAuthenticated()) {
  const currentPath = window.location.pathname.split('/').pop();
  if (currentPath === 'login.html' || currentPath === 'register.html') {
    window.location.href = 'index.html';
  }
}

// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Login form handler
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }
    
    try {
      const data = await authAPI.login(email, password);
      if (data.success) {
        showToast(`Welcome back, ${data.name}!`);
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1200);
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

// Register form handler
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();
    
    if (!name || !email || !password || !confirmPassword) {
      showToast('All fields are required', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    
    try {
      const data = await authAPI.register(name, email, password);
      if (data.success) {
        showToast('Registration successful! Welcome to the blog.');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1200);
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}
