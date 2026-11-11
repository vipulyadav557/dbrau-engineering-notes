
const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');
const registerButton = document.getElementById('registerButton');

function showRegisterMessage(message, type) {
  registerMessage.textContent = message;
  registerMessage.className = `auth-message show ${type}`;
}

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    showRegisterMessage(
      'Password and Confirm Password do not match.',
      'error'
    );
    return;
  }

  registerButton.disabled = true;
  registerButton.textContent = 'Creating account...';

  const studentData = {
    fullName: document.getElementById('fullName').value.trim(),
    rollNumber: document.getElementById('rollNumber').value.trim(),
    email: document.getElementById('email').value.trim(),
    branch: document.getElementById('branch').value,
    year: document.getElementById('year').value,
    password,
    confirmPassword
  };

  try {
    const response = await fetch('/api/student-auth/register', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(studentData)
    });

    const data = await response.json();

    if (!response.ok) {
      showRegisterMessage(
        data.message || 'Registration failed.',
        'error'
      );
      return;
    }

    showRegisterMessage(
      'Registration successful! Redirecting to login...',
      'success'
    );

    registerForm.reset();

    setTimeout(() => {
      window.location.href = '/pages/login.html';
    }, 1200);

  } catch (error) {
    console.error('Registration error:', error);

    showRegisterMessage(
      'Server connection failed. Please try again.',
      'error'
    );
  } finally {
    registerButton.disabled = false;
    registerButton.textContent = 'Create Account';
  }
});
