let sbClient = null;
function getSB() {
  if (!sbClient) sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return sbClient;
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return showError('이메일과 비밀번호를 입력하세요.');
  try {
    const { data, error } = await getSB().auth.signInWithPassword({ email, password });
    if (error) throw error;
    window.location.href = 'pages/dashboard.html';
  } catch (err) { showError('로그인 실패: ' + err.message); }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const dept = document.getElementById('signup-dept').value;
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  if (!name || !email || !password) return showError('모든 항목을 입력하세요.');
  if (password.length < 6) return showError('비밀번호는 6자 이상이어야 합니다.');
  try {
    const { data, error } = await getSB().auth.signUp({ email, password, options: { data: { name, department: dept } } });
    if (error) throw error;
    alert('회원가입 완료! 로그인해주세요.');
    toggleForm('login');
  } catch (err) { showError('회원가입 실패: ' + err.message); }
}

function showError(msg) {
  const el = document.getElementById('auth-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 4000); }
}

function toggleForm(type) {
  document.getElementById('login-form').style.display = type === 'login' ? 'block' : 'none';
  document.getElementById('signup-form').style.display = type === 'signup' ? 'block' : 'none';
  document.getElementById('auth-error').style.display = 'none';
}

async function checkSession() {
  try {
    const { data } = await getSB().auth.getSession();
    if (data.session) window.location.href = 'pages/dashboard.html';
  } catch (e) {}
}

async function checkAuth() {
  try {
    const { data } = await getSB().auth.getSession();
    if (!data.session) {
      window.location.href = '../index.html';
      return null;
    }
    return data.session;
  } catch (e) {
    window.location.href = '../index.html';
    return null;
  }
}

async function logout() {
  await getSB().auth.signOut();
  window.location.href = '../index.html';
}