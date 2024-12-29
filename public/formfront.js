console.log('heiq')

document.getElementById('togglePassword').addEventListener('click', function () {
    const password = document.getElementById('loginPassword');
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
});

document.querySelector('form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        try {
            const response = await fetch('/login', {
                method: 'POST',
                body: new URLSearchParams(formData),  // Ensures the form is submitted as URL-encoded
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'  // Sets correct content-type
                }
            });

            const data = await response.json();
            if (response.ok) {
                window.location.href = '/dashboard';  // Redirect on successful login
            } else {
                const errorDiv = document.getElementById('loginError');
                errorDiv.textContent = data.message || 'Login failed. Please try again.';
                errorDiv.classList.remove('d-none');
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorDiv = document.getElementById('loginError');
            errorDiv.textContent = 'An error occurred. Please try again later.';
            errorDiv.classList.remove('d-none');
        }
    });
