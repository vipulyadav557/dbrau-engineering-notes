
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const loginButton = document.getElementById('loginButton');

function showLoginMessage(message, type) {
  loginMessage.textContent = message;
  loginMessage.className = `auth-message show ${type}`;
}

async function checkExistingLogin() {
  try {
    const response = await fetch('/api/student-auth/me', {
      credentials: 'same-origin'
    });

    if (response.ok) {
      window.location.href = '/pages/dashboard.html';
    }
  } catch (error) {
    console.error('Login status check failed:', error);
  }
}

checkExistingLogin();

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  loginButton.disabled = true;
  loginButton.textContent = 'Signing in...';

  const identifier = document.getElementById('identifier').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/student-auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ identifier, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showLoginMessage(data.message || 'Login failed.', 'error');
      return;
    }

    showLoginMessage('Login successful. Opening dashboard...', 'success');

    window.location.href = '/pages/dashboard.html';

  } catch (error) {
    console.error('Login error:', error);
    showLoginMessage('Server connection failed. Please try again.', 'error');
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Sign In';
  }
});
