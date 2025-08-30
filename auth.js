// Dummy auth handlers for local forms
(function(){
  const REDIRECT_URL = 'https://feedstream.onrender.com/signin';
  const byId = (id)=>document.getElementById(id);
  const EMAIL_KEY = 'fs_email';

  // helper
  const isValidEmail = (v)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // Prefill email on load if available
  const savedEmail = localStorage.getItem(EMAIL_KEY) || '';
  const prefill = (el)=>{ if (el && !el.value) el.value = savedEmail; };
  prefill(byId('si-email'));
  prefill(byId('su-email'));

  // Sign in
  const siForm = document.getElementById('signinForm');
  if (siForm){
    const siEmail = byId('si-email');
    if (siEmail){
      siEmail.addEventListener('input', ()=>{ localStorage.setItem(EMAIL_KEY, siEmail.value.trim()); });
      siEmail.addEventListener('blur', ()=>{ localStorage.setItem(EMAIL_KEY, siEmail.value.trim()); });
    }
    siForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = siEmail.value.trim();
      const pass = byId('si-pass').value.trim();
      const err = byId('si-error');
      if (!isValidEmail(email) || pass.length < 1){
        err.style.display = 'block';
        return;
      }
      err.style.display = 'none';
      localStorage.setItem(EMAIL_KEY, email);
      // Fake async then redirect
      siForm.querySelector('button[type="submit"]').disabled = true;
      setTimeout(()=>{ window.location.href = REDIRECT_URL; }, 400);
    });
  }

  // Sign up
  const suForm = document.getElementById('signupForm');
  if (suForm){
    const suEmail = byId('su-email');
    if (suEmail){
      suEmail.addEventListener('input', ()=>{ localStorage.setItem(EMAIL_KEY, suEmail.value.trim()); });
      suEmail.addEventListener('blur', ()=>{ localStorage.setItem(EMAIL_KEY, suEmail.value.trim()); });
    }
    suForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = byId('su-name').value.trim();
      const email = suEmail.value.trim();
      const pass = byId('su-pass').value.trim();
      const err = byId('su-error');
      if (!name || !isValidEmail(email) || pass.length < 6){
        err.style.display = 'block';
        return;
      }
      err.style.display = 'none';
      localStorage.setItem(EMAIL_KEY, email);
      suForm.querySelector('button[type="submit"]').disabled = true;
      setTimeout(()=>{ window.location.href = REDIRECT_URL; }, 500);
    });
  }
})();
