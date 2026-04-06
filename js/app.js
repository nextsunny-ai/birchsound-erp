// ============================================
// APP - Core application logic
// ============================================

// ---- 금액 포맷 (3자리 쉼표 + 한글 표시) ----
function formatMoney(el) {
  let v = el.value.replace(/[^\d]/g, '');
  if (v) el.value = parseInt(v).toLocaleString();
  else el.value = '';
  const korEl = document.getElementById(el.id + '-korean');
  if (korEl) korEl.textContent = v ? numberToKorean(parseInt(v)) : '';
}
function getMoneyValue(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  return parseInt(el.value.replace(/[^\d]/g, '')) || 0;
}
function numberToKorean(n) {
  if (!n || n === 0) return '';
  const units = ['', '만', '억', '조'];
  const parts = [];
  let i = 0;
  while (n > 0) {
    const part = n % 10000;
    if (part > 0) parts.unshift(part.toLocaleString() + units[i]);
    n = Math.floor(n / 10000);
    i++;
  }
  return parts.join(' ') + '원';
}

// ---- Role-Based Permission System ----
const ROLE_PERMISSIONS = {
  ceo: ['dashboard','attendance','approval','messages','travel','ip','contract','project','calendar','global-cal','tickets','crm','concert-settle','overseas-settle','notice','resources','accounts','hr','admin','settings','report','finance'],
  admin: ['dashboard','attendance','approval','messages','travel','ip','contract','project','calendar','global-cal','tickets','crm','concert-settle','overseas-settle','notice','resources','accounts','hr','admin','report','finance'],
  manager: ['dashboard','attendance','approval','messages','travel','ip','contract','project','calendar','global-cal','tickets','crm','notice','resources','accounts'],
  member: ['dashboard','attendance','approval','messages','travel','ip','contract','project','calendar','global-cal','tickets','crm','concert-settle','overseas-settle','notice','resources','accounts','hr','admin','settings','report','finance'],
  guest: ['dashboard','attendance','approval','messages','travel','ip','contract','project','calendar','global-cal','tickets','crm','concert-settle','overseas-settle','notice','resources','accounts','hr','admin','settings','report','finance']
};

function applyPermissions() {
  try {
    const role = (currentProfile && currentProfile.role) || 'member';
    const allowed = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.member;

    // Hide/show nav items based on permissions
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      const page = item.getAttribute('data-page');
      if (page) {
        item.style.display = allowed.includes(page) ? '' : 'none';
      }
    });

    // Hide entire nav sections if all items are hidden
    document.querySelectorAll('.nav-section').forEach(section => {
      const items = section.querySelectorAll('.nav-item[data-page]');
      const visibleItems = Array.from(items).filter(i => i.style.display !== 'none');
      const title = section.querySelector('.nav-section-title');
      if (title && items.length > 0) {
        section.style.display = visibleItems.length === 0 ? 'none' : '';
      }
    });

    // Show role badge in sidebar
    const roleEl = document.getElementById('user-display-role');
    const roleLabels = { ceo: '대표', admin: '관리자', manager: '팀장', member: '팀원', guest: '게스트 (외주)' };
    if (roleEl) {
      const dept = (currentProfile && currentProfile.department) || '';
      roleEl.textContent = (dept ? dept + ' · ' : '') + (roleLabels[role] || role);
    }
  } catch (e) {
    // Fail-open: if applyPermissions fails, everything stays visible
    console.warn('applyPermissions failed:', e);
  }
}

// ---- Permission Helper ----
function isManager(user) {
  if (!user || !user.profile) return false;
  const name = user.profile.name || '';
  const role = user.profile.role || '';
  // 김한수, 필립 리, 관리자만 ADMIN 접근 가능
  if (name === '김한수' || name === '필립 리' || name === '감독') return true;
  if (role === 'ceo' || role === 'admin') return true;
  return false;
}

function isScheduleEditor(user) {
  if (!user || !user.profile) return false;
  const name = user.profile.name || '';
  const role = user.profile.role || '';
  // 스케줄 편집: 매니저(담당자) + 임원만
  if (name === '담당자' || name === '담당PD') return true;
  if (role === 'manager') return true;
  return isManager(user);
}

let _currentUserIsScheduleEditor = true;
let _currentUserIsManager = true;

// ---- Toast Notifications ----
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '\u2713' : type === 'error' ? '\u2717' : '\u24D8'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ---- Clock ----
function updateClock() {
  const timeEl = document.getElementById('current-time');
  const dateEl = document.getElementById('current-date');
  if (!timeEl) return;

  const now = new Date();
  timeEl.textContent = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  }
}

// ---- i18n (Language Toggle) ----
let currentLang = localStorage.getItem('bs_lang') || 'ko';

const i18n = {
  ko: {
    dashboard: '대시보드', approval: '전자결재', messages: '메시지',
    ip: "Casting", contract: '계약 관리', project: '프로젝트', calendar: '전체 일정', 'global-cal': '글로벌 캘린더',
    notice: '공지사항', resources: '자료실', accounts: '계정/연락처',
    hr: '인사관리', admin: '조직관리', 'concert-settle': '공연 정산', 'overseas-settle': '해외 정산', tickets: '티켓/판매', travel: '출장 관리', crm: 'Partners', attendance: '출퇴근', settings: '설정',
    main: 'MAIN', business: 'BUSINESS', community: 'COMMUNITY',
    today: 'TODAY', clockIn: '출근', clockOut: '퇴근',
    logout: '로그아웃', save: '저장', cancel: '취소', delete: '삭제',
    add: '등록', search: '검색', download: '다운로드',
    langToggle: '🌐 English'
  },
  en: {
    dashboard: 'Dashboard', approval: 'Approvals', messages: 'Messages',
    ip: 'Casting', contract: 'Contracts', project: 'Projects', calendar: 'Calendar', 'global-cal': 'Global Calendar',
    notice: 'Notices', resources: 'Resources', accounts: 'Contacts',
    hr: 'HR', admin: 'Organization', 'concert-settle': 'Concert Settlement', 'overseas-settle': 'Overseas Settlement', tickets: 'Tickets', travel: 'Travel', crm: 'Partners', attendance: 'Attendance', settings: 'Settings',
    main: 'MAIN', business: 'BUSINESS', community: 'COMMUNITY',
    today: 'TODAY', clockIn: 'Clock In', clockOut: 'Clock Out',
    logout: 'Sign Out', save: 'Save', cancel: 'Cancel', delete: 'Delete',
    add: 'Add', search: 'Search', download: 'Download',
    langToggle: '🌐 한국어'
  }
};

function toggleLang() {
  currentLang = currentLang === 'ko' ? 'en' : 'ko';
  localStorage.setItem('bs_lang', currentLang);
  applyLang();
}

function applyLang() {
  const t = i18n[currentLang];
  document.querySelectorAll('.nav-item').forEach(item => {
    const page = item.getAttribute('data-page');
    if (page && t[page]) {
      const svg = item.querySelector('svg');
      const badge = item.querySelector('.nav-badge');
      item.textContent = '';
      if (svg) item.appendChild(svg);
      item.appendChild(document.createTextNode(' ' + t[page]));
      if (badge) item.appendChild(badge);
    }
  });
  document.querySelectorAll('.nav-section-title').forEach(el => {
    const text = el.textContent.trim();
    if (text === 'MAIN' || text === t.main) el.textContent = t.main;
    if (text === 'BUSINESS' || text === t.business) el.textContent = t.business;
    if (text === 'COMMUNITY' || text === t.community) el.textContent = t.community;
    if (text === 'ADMIN') el.textContent = 'ADMIN';
    if (text === 'FINANCE') el.textContent = 'FINANCE';
  });
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = t.langToggle;
}

// ---- Attendance (출근/퇴근) ----
async function clockIn() {
  const user = await getCurrentUser();
  if (!user) return;
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await getSB().from('attendance').select('*').eq('user_id', user.id).eq('date', today).single();
  if (existing && existing.clock_in) { showToast('이미 출근 처리되었습니다.', 'error'); return; }

  const { error } = await getSB().from('attendance').upsert({ user_id: user.id, date: today, clock_in: new Date().toISOString(), status: 'working' });
  if (error) { showToast('출근 실패: ' + error.message, 'error'); return; }
  showToast('출근 완료!', 'success');
  updateAttendanceUI();
}

async function clockOut() {
  const user = await getCurrentUser();
  if (!user) return;
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await getSB().from('attendance').select('*').eq('user_id', user.id).eq('date', today).single();
  if (!existing || !existing.clock_in) { showToast('먼저 출근하세요.', 'error'); return; }
  if (existing.clock_out) { showToast('이미 퇴근했습니다.', 'error'); return; }

  const now = new Date();
  const totalMins = (now - new Date(existing.clock_in)) / 60000;
  const breakMins = existing.break_minutes || 0;
  const workMins = totalMins - breakMins;
  const workHours = (workMins / 60).toFixed(1);

  const { error } = await getSB().from('attendance').update({
    clock_out: now.toISOString(),
    work_hours: parseFloat(workHours),
    status: 'done'
  }).eq('id', existing.id);

  if (error) { showToast('퇴근 실패: ' + error.message, 'error'); return; }
  showToast('퇴근 완료! 실근무: ' + workHours + '시간', 'success');
  updateAttendanceUI();
}

async function updateAttendanceUI() {
  const user = await getCurrentUser();
  if (!user) return;
  const today = new Date().toISOString().split('T')[0];

  const { data } = await getSB().from('attendance').select('*').eq('user_id', user.id).eq('date', today).single();

  const btnIn = document.getElementById('btn-clock-in');
  const btnOut = document.getElementById('btn-clock-out');
  const statusEl = document.getElementById('attendance-status');
  const detailEl = document.getElementById('today-status-detail');

  if (!btnIn) return;

  // 버튼 초기화
  btnIn.disabled = true; btnOut.disabled = true;

  const fmt = (iso) => iso ? new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-';

  if (!data || !data.clock_in) {
    // 미출근
    btnIn.disabled = false;
    btnIn.style.background = 'var(--primary)'; btnIn.style.color = 'white'; btnIn.style.opacity = '1';
    btnOut.style.opacity = '0.3';
    if (statusEl) statusEl.innerHTML = '<span class="status-badge off">미출근</span>';
    if (detailEl) detailEl.style.display = 'none';
  } else if (!data.clock_out) {
    // 근무중 — 출근 버튼 초록색으로 변경, 퇴근 활성화
    btnIn.style.background = '#16A34A'; btnIn.style.color = 'white'; btnIn.style.opacity = '0.6';
    btnIn.textContent = '✓ 출근완료';
    btnOut.disabled = false;
    btnOut.style.opacity = '1'; btnOut.style.background = 'var(--gray-900)'; btnOut.style.color = 'white';
    if (statusEl) statusEl.innerHTML = '<span class="status-badge working">근무중</span>';
    showTodayDetail(data);
  } else {
    // 퇴근완료 — 둘 다 비활성
    btnIn.style.background = '#16A34A'; btnIn.style.opacity = '0.4'; btnIn.textContent = '✓ 출근완료';
    btnOut.style.background = '#2563EB'; btnOut.style.opacity = '0.6'; btnOut.textContent = '✓ 퇴근완료'; btnOut.style.color = 'white';
    if (statusEl) statusEl.innerHTML = '<span class="status-badge done">퇴근완료</span>';
    showTodayDetail(data);
  }
}

function showTodayDetail(data) {
  const detailEl = document.getElementById('today-status-detail');
  if (!detailEl) return;
  detailEl.style.display = 'block';

  const fmt = (iso) => iso ? new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-';

  document.getElementById('today-clock-in').textContent = fmt(data.clock_in);
  document.getElementById('today-clock-out').textContent = fmt(data.clock_out);
  document.getElementById('today-break').textContent = data.break_minutes ? data.break_minutes + '분' : '-';
  document.getElementById('today-work-hours').textContent = data.work_hours ? data.work_hours + '시간' : '근무중...';
}

// ---- Attendance History ----
async function loadAttendanceHistory() {
  const user = await getCurrentUser();
  if (!user) return;

  const { data } = await sb
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30);

  const tbody = document.getElementById('attendance-history');
  if (!tbody || !data) return;

  const canSeeTime = isManager(user);

  tbody.innerHTML = data.map(record => {
    const statusClass = record.status === 'working' ? 'working' : record.status === 'done' ? 'done' : 'off';
    const statusText = record.status === 'working' ? '근무중' : record.status === 'done' ? '퇴근' : '-';

    if (canSeeTime) {
      const clockIn = record.clock_in ? new Date(record.clock_in).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-';
      const clockOut = record.clock_out ? new Date(record.clock_out).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-';
      return `<tr>
        <td>${record.date}</td>
        <td>${clockIn}</td>
        <td>${clockOut}</td>
        <td>${record.work_hours ? record.work_hours + '시간' : '-'}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      </tr>`;
    } else {
      return `<tr>
        <td>${record.date}</td>
        <td>${record.clock_in ? 'O' : '-'}</td>
        <td>${record.clock_out ? 'O' : '-'}</td>
        <td>-</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      </tr>`;
    }
  }).join('');
}

// ---- Notices ----
async function loadNotices() {
  const { data } = await sb
    .from('notices')
    .select('*, profiles(name)')
    .order('created_at', { ascending: false })
    .limit(20);

  const list = document.getElementById('notice-list');
  if (!list || !data) return;

  if (data.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>등록된 공지사항이 없습니다.</p></div>';
    return;
  }

  list.innerHTML = data.map(notice => {
    const tagClass = notice.tag === 'important' ? 'important' : notice.tag === 'event' ? 'event' : 'general';
    const tagText = notice.tag === 'important' ? '중요' : notice.tag === 'event' ? '행사' : '일반';
    const date = new Date(notice.created_at).toLocaleDateString('ko-KR');
    const author = notice.profiles ? notice.profiles.name : '관리자';

    return `<div class="notice-item" onclick="viewNotice('${notice.id}')">
      <div>
        <span class="notice-tag ${tagClass}">${tagText}</span>
        <span class="notice-title">${notice.title}</span>
      </div>
      <div class="notice-meta">${author} · ${date}</div>
    </div>`;
  }).join('');
}

async function createNotice(title, content, tag) {
  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await getSB().from('notices').insert({
    title,
    content,
    tag,
    author_id: user.id
  });

  if (error) {
    showToast('공지 등록 실패: ' + error.message, 'error');
    return;
  }

  showToast('공지가 등록되었습니다.', 'success');
  closeModal('notice-modal');
  loadNotices();
}

async function viewNotice(id) {
  const { data } = await sb
    .from('notices')
    .select('*, profiles(name)')
    .eq('id', id)
    .single();

  if (!data) return;

  const modal = document.getElementById('notice-view-modal');
  if (!modal) return;

  document.getElementById('view-notice-title').textContent = data.title;
  document.getElementById('view-notice-content').textContent = data.content;
  document.getElementById('view-notice-meta').textContent =
    `${data.profiles?.name || '관리자'} · ${new Date(data.created_at).toLocaleDateString('ko-KR')}`;

  openModal('notice-view-modal');
}

// ---- Approvals ----
const APPROVAL_TYPES = {
  'leave': { label: '연차 신청', color: '#2563EB' },
  'vacation': { label: '휴가 신청', color: '#9333EA' },
  'expense': { label: '지출 결의', color: '#16A34A' },
  'purchase': { label: '구매 요청', color: '#EA580C' },
  'report': { label: '업무 보고', color: '#6B7280' },
  'other': { label: '기타', color: '#6B7280' }
};

function onApprovalTypeChange() {
  const type = document.getElementById('approval-type').value;
  const dateFields = document.getElementById('approval-date-fields');
  const amountField = document.getElementById('approval-amount-field');
  if (dateFields) dateFields.style.display = (type === 'leave' || type === 'vacation') ? 'block' : 'none';
  if (amountField) amountField.style.display = (type === 'expense' || type === 'purchase') ? 'block' : 'none';
}

async function loadApprovalApprovers() {
  const select = document.getElementById('approval-approver');
  if (!select) return;
  const { data } = await getSB().from('profiles').select('id, name, role').order('name');
  if (!data) return;
  // 결재자: 김한수(기본), 필립 리만 표시 (본인 제외)
  const myId = currentUser ? currentUser.id : '';
  const approvers = data.filter(p => p.id !== myId && (p.role === 'ceo' || p.name === '김한수' || p.name === '필립 리'));
  if (approvers.length === 0) {
    // 프로필에 없으면 전체 표시
    select.innerHTML = data.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  } else {
    select.innerHTML = approvers.map(p => `<option value="${p.id}" ${p.name === '김한수' ? 'selected' : ''}>${p.name} (대표)</option>`).join('');
  }
}

async function loadApprovals(filter = 'all') {
  const user = await getCurrentUser();
  if (!user) return;

  // Load approvers for the modal
  loadApprovalApprovers();

  let query = sb
    .from('approvals')
    .select('*, profiles!approvals_requester_id_fkey(name)')
    .order('created_at', { ascending: false });

  if (filter === 'my') {
    query = query.eq('requester_id', user.id);
  } else if (filter === 'pending') {
    query = query.eq('status', 'pending').eq('approver_id', user.id);
  }

  const { data } = await query.limit(30);

  const list = document.getElementById('approval-list');
  if (!list) return;

  if (!data || data.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>결재 내역이 없습니다.</p></div>';
    return;
  }

  list.innerHTML = data.map(item => {
    const typeInfo = APPROVAL_TYPES[item.type] || { label: item.type, color: '#6B7280' };
    const date = new Date(item.created_at).toLocaleDateString('ko-KR');
    const requesterName = item.profiles ? item.profiles.name : '알 수 없음';
    const statusLabel = item.status === 'pending' ? '대기중' : item.status === 'approved' ? '승인' : '반려';
    const statusColor = item.status === 'pending' ? '#B8860B' : item.status === 'approved' ? '#16A34A' : '#DC2626';
    const statusBg = item.status === 'pending' ? 'var(--yellow-bg, #FEF3C7)' : item.status === 'approved' ? '#DCFCE7' : '#FEE2E2';

    let extraInfo = '';
    if ((item.type === 'expense' || item.type === 'purchase') && item.amount) {
      extraInfo += `<span style="font-size:14px; color:var(--gray-500); margin-left:8px;">${Number(item.amount).toLocaleString()}원</span>`;
    }
    if ((item.type === 'leave' || item.type === 'vacation') && item.start_date) {
      extraInfo += `<span style="font-size:14px; color:var(--gray-500); margin-left:8px;">${item.start_date} ~ ${item.end_date || ''}</span>`;
    }

    return `<div class="approval-item" style="cursor:pointer; padding:12px 16px; border-bottom:1px solid var(--gray-100, #f3f4f6); display:flex; align-items:center; justify-content:space-between;" onclick="openApprovalDetail('${item.id}')">
      <div class="approval-info" style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
        <span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:14px; font-weight:600; color:white; background:${typeInfo.color}; white-space:nowrap;">${typeInfo.label}</span>
        <div style="min-width:0; flex:1;">
          <div class="approval-title" style="font-weight:600; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.title}${extraInfo}</div>
          <div class="approval-meta" style="font-size:14px; color:var(--gray-500, #6b7280);">${requesterName} · ${date}</div>
        </div>
      </div>
      <div>
        <span style="display:inline-block; padding:2px 10px; border-radius:4px; font-size:14px; font-weight:600; color:${statusColor}; background:${statusBg};">${statusLabel}</span>
      </div>
    </div>`;
  }).join('');
}

async function createApproval(type, title, content, extras = {}) {
  const user = await getCurrentUser();
  if (!user) return;

  let approverId = extras.approver_id;

  if (!approverId) {
    // Get first admin/ceo as approver
    const { data: admins } = await sb
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'ceo'])
      .limit(1);

    approverId = admins && admins.length > 0 ? admins[0].id : user.id;
  }

  // DB type은 leave/expense/report/other만 허용 → 매핑
  const typeMap = { leave: 'leave', vacation: 'leave', expense: 'expense', purchase: 'expense', report: 'report', other: 'other' };
  const dbType = typeMap[type] || 'other';

  // 추가 정보를 content에 합치기
  let fullContent = content || '';
  if (extras.start_date || extras.end_date) fullContent += '\n[기간] ' + (extras.start_date || '') + ' ~ ' + (extras.end_date || '');
  if (extras.amount) fullContent += '\n[금액] ₩' + parseInt(extras.amount).toLocaleString();
  if (extras.attachment_memo) fullContent += '\n[첨부메모] ' + extras.attachment_memo;
  fullContent += '\n[원본타입] ' + type;

  const insertData = {
    requester_id: user.id,
    approver_id: approverId,
    type: dbType,
    title,
    content: fullContent,
    status: 'pending'
  };

  const { error } = await getSB().from('approvals').insert(insertData);

  if (error) {
    showToast('결재 요청 실패: ' + error.message, 'error');
    return;
  }

  showToast('결재가 요청되었습니다.', 'success');

  // 결재자에게 메시지 알림 보내기
  const typeLabels = { leave: '연차 신청', vacation: '휴가 신청', expense: '지출 결의', purchase: '구매 요청', report: '업무 보고', other: '기타' };
  const typeLabel = typeLabels[type] || type;
  const msgStore = JSON.parse(localStorage.getItem('bs_messages') || '[]');
  msgStore.unshift({
    id: 'msg_' + Date.now(),
    from: user.id,
    fromName: user.profile?.name || '알수없음',
    to: approverId,
    toName: '결재자',
    content: `[전자결재 알림] ${user.profile?.name || ''}님이 "${title}" (${typeLabel})을 결재 요청했습니다.`,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem('bs_messages', JSON.stringify(msgStore));

  closeModal('approval-modal');
  document.getElementById('approval-title').value = '';
  document.getElementById('approval-content').value = '';
  document.getElementById('approval-type').value = 'leave';
  if (document.getElementById('approval-start-date')) document.getElementById('approval-start-date').value = '';
  if (document.getElementById('approval-end-date')) document.getElementById('approval-end-date').value = '';
  if (document.getElementById('approval-amount')) document.getElementById('approval-amount').value = '';
  if (document.getElementById('approval-attachment-memo')) document.getElementById('approval-attachment-memo').value = '';
  onApprovalTypeChange();
  loadApprovals();
}

async function handleApproval(id, status, rejectReason) {
  const updateData = { status, decided_at: new Date().toISOString() };
  if (status === 'rejected' && rejectReason) {
    updateData.reject_reason = rejectReason;
  }

  const { error } = await sb
    .from('approvals')
    .update(updateData)
    .eq('id', id);

  if (error) {
    showToast('처리 실패: ' + error.message, 'error');
    return;
  }

  showToast(status === 'approved' ? '승인되었습니다.' : '반려되었습니다.', 'success');
  closeModal('approval-detail-modal');
  loadApprovals();
}

async function openApprovalDetail(id) {
  const { data: item } = await sb
    .from('approvals')
    .select('*, profiles!approvals_requester_id_fkey(name)')
    .eq('id', id)
    .single();

  if (!item) { showToast('결재를 찾을 수 없습니다.', 'error'); return; }

  const user = await getCurrentUser();
  const typeInfo = APPROVAL_TYPES[item.type] || { label: item.type, color: '#6B7280' };
  const date = new Date(item.created_at).toLocaleDateString('ko-KR');
  const requesterName = item.profiles ? item.profiles.name : '알 수 없음';
  const statusLabel = item.status === 'pending' ? '대기중' : item.status === 'approved' ? '승인' : '반려';
  const statusColor = item.status === 'pending' ? '#B8860B' : item.status === 'approved' ? '#16A34A' : '#DC2626';
  const statusBg = item.status === 'pending' ? 'var(--yellow-bg, #FEF3C7)' : item.status === 'approved' ? '#DCFCE7' : '#FEE2E2';

  let detailHtml = `
    <div style="margin-bottom:16px; display:flex; align-items:center; gap:10px;">
      <span style="display:inline-block; padding:3px 10px; border-radius:4px; font-size:14px; font-weight:600; color:white; background:${typeInfo.color};">${typeInfo.label}</span>
      <span style="display:inline-block; padding:3px 10px; border-radius:4px; font-size:14px; font-weight:600; color:${statusColor}; background:${statusBg};">${statusLabel}</span>
    </div>
    <div style="margin-bottom:12px;">
      <div style="font-size:14px; color:var(--gray-500); margin-bottom:2px;">제목</div>
      <div style="font-weight:600; font-size:16px;">${item.title}</div>
    </div>
    <div style="margin-bottom:12px;">
      <div style="font-size:14px; color:var(--gray-500); margin-bottom:2px;">요청자</div>
      <div>${requesterName}</div>
    </div>
    <div style="margin-bottom:12px;">
      <div style="font-size:14px; color:var(--gray-500); margin-bottom:2px;">요청일</div>
      <div>${date}</div>
    </div>`;

  if ((item.type === 'leave' || item.type === 'vacation') && item.start_date) {
    detailHtml += `
    <div style="margin-bottom:12px;">
      <div style="font-size:14px; color:var(--gray-500); margin-bottom:2px;">기간</div>
      <div>${item.start_date} ~ ${item.end_date || ''}</div>
    </div>`;
  }

  if ((item.type === 'expense' || item.type === 'purchase') && item.amount) {
    detailHtml += `
    <div style="margin-bottom:12px;">
      <div style="font-size:14px; color:var(--gray-500); margin-bottom:2px;">금액</div>
      <div style="font-weight:600;">${Number(item.amount).toLocaleString()}원</div>
    </div>`;
  }

  if (item.content) {
    detailHtml += `
    <div style="margin-bottom:12px;">
      <div style="font-size:14px; color:var(--gray-500); margin-bottom:2px;">상세 내용</div>
      <div style="white-space:pre-wrap; background:var(--gray-50, #f9fafb); padding:10px; border-radius:6px; font-size:14px;">${item.content}</div>
    </div>`;
  }

  if (item.attachment_memo) {
    detailHtml += `
    <div style="margin-bottom:12px;">
      <div style="font-size:14px; color:var(--gray-500); margin-bottom:2px;">첨부 메모</div>
      <div style="white-space:pre-wrap; background:var(--gray-50, #f9fafb); padding:10px; border-radius:6px; font-size:14px;">${item.attachment_memo}</div>
    </div>`;
  }

  if (item.status === 'rejected' && item.reject_reason) {
    detailHtml += `
    <div style="margin-bottom:12px;">
      <div style="font-size:14px; color:#DC2626; margin-bottom:2px;">반려 사유</div>
      <div style="white-space:pre-wrap; background:#FEE2E2; padding:10px; border-radius:6px; font-size:14px; color:#991B1B;">${item.reject_reason}</div>
    </div>`;
  }

  document.getElementById('approval-detail-content').innerHTML = detailHtml;

  // Show approve/reject buttons only for the approver and if pending
  let actionsHtml = '<button class="btn btn-secondary btn-sm" onclick="closeModal(\'approval-detail-modal\')">닫기</button>';
  if (item.status === 'pending' && user && item.approver_id === user.id) {
    actionsHtml += `
      <div id="approval-reject-reason-wrap" style="display:none; flex:1; margin:0 8px;">
        <textarea id="approval-reject-reason" placeholder="반려 사유를 입력하세요" rows="2" style="width:100%; resize:vertical;"></textarea>
      </div>
      <button class="btn btn-primary btn-sm" onclick="handleApproval('${item.id}', 'approved')">승인</button>
      <button class="btn btn-sm" style="background:#DC2626; color:white; border:none;" onclick="showRejectReason('${item.id}')">반려</button>`;
  }
  document.getElementById('approval-detail-actions').innerHTML = actionsHtml;

  openModal('approval-detail-modal');
}

function showRejectReason(approvalId) {
  const wrap = document.getElementById('approval-reject-reason-wrap');
  if (wrap) {
    if (wrap.style.display === 'none') {
      wrap.style.display = 'block';
      // Replace the reject button to confirm
      const rejectBtn = wrap.parentElement.querySelector('[style*="DC2626"]');
      if (rejectBtn) {
        rejectBtn.textContent = '반려 확인';
        rejectBtn.onclick = function() {
          const reason = document.getElementById('approval-reject-reason').value.trim();
          if (!reason) { showToast('반려 사유를 입력해주세요.', 'error'); return; }
          handleApproval(approvalId, 'rejected', reason);
        };
      }
    }
  }
}

// ---- Settlements ----
async function loadSettlements() {
  const user = await getCurrentUser();
  if (!user) return;

  const { data } = await sb
    .from('settlements')
    .select('*, profiles(name)')
    .order('created_at', { ascending: false })
    .limit(30);

  const tbody = document.getElementById('settlement-list');
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">정산 내역이 없습니다.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(item => {
    const date = new Date(item.created_at).toLocaleDateString('ko-KR');
    const amount = parseInt(item.amount).toLocaleString();

    return `<tr>
      <td>${date}</td>
      <td>${item.project || '-'}</td>
      <td>${item.description}</td>
      <td class="amount negative">${amount}원</td>
      <td>${item.profiles?.name || '-'}</td>
      <td><span class="badge badge-${item.status}">${item.status === 'pending' ? '대기' : item.status === 'approved' ? '승인' : '반려'}</span></td>
    </tr>`;
  }).join('');
}

async function createSettlement(project, description, amount) {
  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await getSB().from('settlements').insert({
    user_id: user.id,
    project,
    description,
    amount: parseInt(amount),
    status: 'pending'
  });

  if (error) {
    showToast('정산 등록 실패: ' + error.message, 'error');
    return;
  }

  showToast('정산이 등록되었습니다.', 'success');
  closeModal('settlement-modal');
  loadSettlements();
}

// ---- Dashboard Stats ----
async function loadDashboardStats() {
  const user = await getCurrentUser();
  if (!user) return;

  // Today's attendance count
  const today = new Date().toISOString().split('T')[0];
  const { count: attendanceCount } = await sb
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('date', today)
    .not('clock_in', 'is', null);

  // Pending approvals count
  const { count: pendingCount } = await sb
    .from('approvals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // This month settlements total
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { data: settlements } = await sb
    .from('settlements')
    .select('amount')
    .gte('created_at', firstDay);

  const totalExpense = settlements ? settlements.reduce((sum, s) => sum + (s.amount || 0), 0) : 0;

  // Recent notices count
  const { count: noticeCount } = await sb
    .from('notices')
    .select('*', { count: 'exact', head: true });

  // Update UI
  const el = (id) => document.getElementById(id);
  if (el('stat-attendance')) el('stat-attendance').textContent = attendanceCount || 0;
  if (el('stat-pending')) el('stat-pending').textContent = pendingCount || 0;
  if (el('stat-expense')) el('stat-expense').textContent = totalExpense.toLocaleString() + '원';
  if (el('stat-notices')) el('stat-notices').textContent = noticeCount || 0;
}

// ---- Modal Helpers ----
function openModal(id) {
  document.getElementById(id)?.classList.add('active');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

// ---- Sidebar Navigation ----
function navigateTo(page) {
  // Permission check
  const role = (currentProfile && currentProfile.role) || 'member';
  const allowed = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.member;
  if (!allowed.includes(page) && page !== 'dashboard') {
    showToast('접근 권한이 없습니다.', 'error');
    return;
  }

  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.page-section').forEach(el => el.style.display = 'none');

  const navItem = document.querySelector(`[data-page="${page}"]`);
  const section = document.getElementById(`section-${page}`);

  if (navItem) navItem.classList.add('active');
  if (section) section.style.display = 'block';

  // Load data for each section
  switch(page) {
    case 'dashboard': if (typeof loadDashboard === 'function') loadDashboard(); else loadDashboardStats(); break;
    case 'attendance': updateAttendanceUI(); loadAttendanceHistory(); break;
    case 'approval': loadApprovals(); break;
    case 'settlement': loadSettlements(); break;
    case 'notice': loadNotices(); break;
    case 'resources': loadResources(); break;
    case 'admin': loadMembers(); break;
    case 'hr': loadHRList(); loadMembers(); break;
    case 'project': loadProjects(); break;
    case 'accounts': loadAccounts(); loadContacts(); loadParttimeContacts(); break;
    case 'calendar': loadCalendar(); break;
    case 'messages': loadMessages(); break;
    case 'ip': loadIP(); break;
    case 'contract': loadContracts(); break;
    case 'finance': loadFinance(); break;
    case 'report': loadReport(); break;
    case 'settings': loadSettings(); break;
    case 'concert-settle': loadConcertSettle(); break;
    case 'overseas-settle': loadOverseasSettle(); break;
    case 'tickets': loadTickets(); break;
    case 'travel': loadTravel(); break;
    case 'crm': loadCRM(); break;
    case 'global-cal': loadGlobalCal(); break;
  }
}

// ---- Init Sidebar User ----
async function initSidebar() {
  const user = await getCurrentUser();
  if (!user || !user.profile) return;

  const nameEl = document.getElementById('user-display-name');
  const roleEl = document.getElementById('user-display-role');
  const avatarEl = document.getElementById('user-avatar');

  if (nameEl) nameEl.textContent = user.profile.name;
  if (roleEl) {
    const roleMap = { ceo: '대표', admin: '관리자', manager: '팀장', member: '팀원' };
    roleEl.textContent = `${user.profile.department || ''} · ${roleMap[user.profile.role] || user.profile.role}`;
  }
  if (avatarEl) avatarEl.textContent = getInitials(user.profile.name);

  // Show/hide admin menu
  checkAdminVisibility();
}

// ---- Admin: Members ----
async function loadMembers() {
  const user = await getCurrentUser();
  if (!user) return;

  // Check permission
  if (!isManager(user)) {
    const tbody = document.getElementById('members-list');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="empty-state">관리자 권한이 필요합니다.</td></tr>';
    return;
  }

  // Get all profiles
  const { data: members } = await sb
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  // Get today's attendance
  const today = new Date().toISOString().split('T')[0];
  const { data: todayAttendance } = await sb
    .from('attendance')
    .select('user_id, status, clock_in')
    .eq('date', today);

  const attendanceMap = {};
  if (todayAttendance) {
    todayAttendance.forEach(a => { attendanceMap[a.user_id] = a; });
  }

  const tbody = document.getElementById('members-list');
  if (!tbody || !members) return;

  // Update stats
  const el = (id) => document.getElementById(id);
  if (el('stat-total-members')) el('stat-total-members').textContent = members.length;
  if (el('stat-today-working')) el('stat-today-working').textContent = todayAttendance ? todayAttendance.filter(a => a.status === 'working').length : 0;

  const roleMap = { ceo: '대표', admin: '관리자', manager: '팀장', member: '팀원' };

  tbody.innerHTML = members.map(m => {
    const att = attendanceMap[m.id];
    const attStatus = att ? (att.status === 'working' ? '<span class="status-badge working">근무중</span>' : '<span class="status-badge done">퇴근</span>') : '<span class="status-badge off">미출근</span>';
    const isMe = m.id === user.id;

    return `<tr>
      <td><strong>${m.name}</strong>${isMe ? ' <span style="font-size:14px; color:var(--red);">(나)</span>' : ''}</td>
      <td>${m.department || '-'}</td>
      <td style="font-size:14px; color:var(--gray-500);">${m.email}</td>
      <td>
        <select onchange="changeRole('${m.id}', this.value)" style="padding:4px 8px; border:1px solid var(--gray-200); border-radius:4px; font-size:14px;" ${isMe ? 'disabled' : ''}>
          <option value="member" ${m.role === 'member' ? 'selected' : ''}>팀원</option>
          <option value="manager" ${m.role === 'manager' ? 'selected' : ''}>팀장</option>
          <option value="admin" ${m.role === 'admin' ? 'selected' : ''}>관리자</option>
          <option value="ceo" ${m.role === 'ceo' ? 'selected' : ''}>대표</option>
        </select>
      </td>
      <td>${attStatus}</td>
      <td>
        <select onchange="changeDepartment('${m.id}', this.value)" style="padding:4px 8px; border:1px solid var(--gray-200); border-radius:4px; font-size:14px;">
          <option value="" ${!m.department ? 'selected' : ''}>미지정</option>
          <option value="경영" ${m.department === '경영' ? 'selected' : ''}>경영</option>
          <option value="기획" ${m.department === '기획' ? 'selected' : ''}>기획</option>
          <option value="제작" ${m.department === '제작' ? 'selected' : ''}>제작</option>
          <option value="아티스트" ${m.department === '아티스트' ? 'selected' : ''}>아티스트</option>
          <option value="마케팅" ${m.department === '마케팅' ? 'selected' : ''}>마케팅</option>
          <option value="디자인" ${m.department === '디자인' ? 'selected' : ''}>디자인</option>
          <option value="기술" ${m.department === '기술' ? 'selected' : ''}>기술</option>
          <option value="기타" ${m.department === '기타' ? 'selected' : ''}>기타</option>
        </select>
      </td>
    </tr>`;
  }).join('');
}

async function changeRole(userId, newRole) {
  const { error } = await sb
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    showToast('권한 변경 실패: ' + error.message, 'error');
    return;
  }
  showToast('권한이 변경되었습니다.', 'success');
}

async function changeDepartment(userId, newDept) {
  const { error } = await sb
    .from('profiles')
    .update({ department: newDept })
    .eq('id', userId);

  if (error) {
    showToast('부서 변경 실패: ' + error.message, 'error');
    return;
  }
  showToast('부서가 변경되었습니다.', 'success');
}

// ---- Resources: Templates ----
function downloadTemplate(type) {
  const templates = {
    proposal: '../templates/proposal-general.html',
  };
  if (templates[type]) {
    window.open(templates[type], '_blank');
  } else {
    showToast('이 양식은 준비 중입니다.', 'info');
  }
}

function copyColor() {
  const colors = 'Primary: #FF3B30\nBlack: #0A0A0A\nLight: #F2F2F2';
  navigator.clipboard.writeText(colors).then(() => {
    showToast('브랜드 컬러코드가 복사되었습니다!', 'success');
  });
}

// ---- Admin visibility ----
async function checkAdminVisibility() {
  const user = await getCurrentUser();
  if (!user) return;
  const adminSection = document.getElementById('nav-admin-section');
  if (adminSection && !isManager(user)) {
    adminSection.style.display = 'none';
  }
}

// ---- Tab switching ----
function switchTab(tabGroup, tabName) {
  document.querySelectorAll(`[data-tab-group="${tabGroup}"] .tab-item`).forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tabName);
  });
  document.querySelectorAll(`[data-tab-content-group="${tabGroup}"] .tab-content`).forEach(el => {
    el.classList.toggle('active', el.dataset.tabContent === tabName);
  });
}

// ============================================
// HR Management (인사관리)
// ============================================

// Get HR extra data from localStorage
function getHRStore() {
  try {
    return JSON.parse(localStorage.getItem('bs_hr_data') || '{}');
  } catch (e) {
    return {};
  }
}

function setHRStore(data) {
  localStorage.setItem('bs_hr_data', JSON.stringify(data));
}

// Calculate monthly pay
function calculateMonthlyPay(workHours, payType, payAmount) {
  if (!payAmount) return 0;
  if (payType === '시급') {
    return Math.round(workHours * payAmount);
  }
  return payAmount; // 월급은 그대로
}

// Load HR list - merge profiles with localStorage HR data
async function loadHRList() {
  const user = await getCurrentUser();
  if (!user) return;

  if (!isManager(user)) {
    const tbody = document.getElementById('hr-employee-list');
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="empty-state">관리자 권한이 필요합니다.</td></tr>';
    return;
  }

  // Get all profiles from Supabase
  const { data: members } = await sb
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (!members) return;

  const hrStore = getHRStore();

  // Get this month's attendance for pay calculation
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: monthAttendance } = await sb
    .from('attendance')
    .select('user_id, work_hours')
    .gte('date', firstDay)
    .lte('date', lastDay)
    .eq('status', 'done');

  // Build work hours map
  const workHoursMap = {};
  if (monthAttendance) {
    monthAttendance.forEach(a => {
      if (!workHoursMap[a.user_id]) workHoursMap[a.user_id] = 0;
      workHoursMap[a.user_id] += (a.work_hours || 0);
    });
  }

  const roleMap = { ceo: '대표', admin: '관리자', manager: '팀장', member: '팀원' };

  // Calculate stats
  let totalPay = 0, salaryPay = 0, hourlyPay = 0, totalHours = 0, hourlyCount = 0;

  const tbody = document.getElementById('hr-employee-list');
  if (!tbody) return;

  tbody.innerHTML = members.map(m => {
    const hr = hrStore[m.id] || {};
    const contractType = hr.contractType || '정규직';
    const payType = hr.payType || '월급';
    const payAmount = hr.payAmount || 0;
    const joinDate = hr.joinDate || '-';
    const phone = hr.phone || '-';
    const status = hr.status || '재직';
    const userHours = workHoursMap[m.id] || 0;

    // Pay calculation
    const monthPay = calculateMonthlyPay(userHours, payType, payAmount);
    totalPay += monthPay;
    if (payType === '월급') {
      salaryPay += monthPay;
    } else {
      hourlyPay += monthPay;
    }
    totalHours += userHours;
    if (userHours > 0) hourlyCount++;

    const payDisplay = payAmount
      ? (payType === '시급' ? payAmount.toLocaleString() + '원/시' : payAmount.toLocaleString() + '원/월')
      : '-';

    const statusClass = status === '재직' ? 'working' : 'off';

    return `<tr>
      <td><strong>${m.name}</strong></td>
      <td>${m.department || '-'}</td>
      <td>${roleMap[m.role] || m.role || '-'}</td>
      <td>${contractType}</td>
      <td>${payDisplay}</td>
      <td>${joinDate}</td>
      <td>${phone}</td>
      <td><span class="status-badge ${statusClass}">${status}</span></td>
      <td><button class="btn btn-ghost btn-sm" onclick="openHRModal('${m.id}')">수정</button></td>
    </tr>`;
  }).join('');

  // Update stats
  const el = (id) => document.getElementById(id);
  if (el('hr-stat-total-pay')) el('hr-stat-total-pay').textContent = totalPay.toLocaleString() + '원';
  if (el('hr-stat-salary-pay')) el('hr-stat-salary-pay').textContent = salaryPay.toLocaleString() + '원';
  if (el('hr-stat-hourly-pay')) el('hr-stat-hourly-pay').textContent = hourlyPay.toLocaleString() + '원';
  if (el('hr-stat-avg-hours')) el('hr-stat-avg-hours').textContent = hourlyCount > 0 ? (totalHours / hourlyCount).toFixed(1) + '시간' : '-';

  // Load leave summary
  loadHRLeave(members, hrStore, workHoursMap);

  // Load payslips
  loadPayslips();
}

// Load leave (연차) summary
function loadHRLeave(members, hrStore, workHoursMap) {
  const tbody = document.getElementById('hr-leave-list');
  if (!tbody) return;

  tbody.innerHTML = members.map(m => {
    const hr = hrStore[m.id] || {};
    const status = hr.status || '재직';
    if (status === '퇴직') return '';

    // Default 15 days annual leave, calculate used from attendance gaps
    const totalLeave = hr.totalLeave || 15;
    const usedLeave = hr.usedLeave || 0;
    const remaining = totalLeave - usedLeave;

    let leaveStatus = '';
    if (remaining <= 0) {
      leaveStatus = '<span class="status-badge off">소진</span>';
    } else if (remaining <= 3) {
      leaveStatus = '<span class="status-badge" style="background:var(--yellow-bg); color:#B8860B;">부족</span>';
    } else {
      leaveStatus = '<span class="status-badge working">정상</span>';
    }

    return `<tr>
      <td><strong>${m.name}</strong></td>
      <td>${totalLeave}일</td>
      <td>${usedLeave}일</td>
      <td>${remaining}일</td>
      <td>${leaveStatus}</td>
    </tr>`;
  }).filter(Boolean).join('');

  if (!tbody.innerHTML) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">연차 정보가 없습니다.</td></tr>';
  }
}

// Open HR modal for new or edit
async function openHRModal(userId) {
  const titleEl = document.getElementById('hr-modal-title');

  // Reset form
  document.getElementById('hr-edit-user-id').value = '';
  document.getElementById('hr-name').value = '';
  document.getElementById('hr-email').value = '';
  document.getElementById('hr-phone').value = '';
  document.getElementById('hr-department').value = '';
  document.getElementById('hr-role').value = 'member';
  document.getElementById('hr-contract-type').value = '정규직';
  document.getElementById('hr-pay-type').value = '월급';
  document.getElementById('hr-pay-amount').value = '';
  document.getElementById('hr-join-date').value = '';
  document.getElementById('hr-status').value = '재직';
  document.getElementById('hr-memo').value = '';

  if (userId) {
    // Edit mode - load existing data
    titleEl.textContent = '직원 정보 수정';
    document.getElementById('hr-edit-user-id').value = userId;

    // Load from Supabase profile
    const { data: profile } = await sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      document.getElementById('hr-name').value = profile.name || '';
      document.getElementById('hr-email').value = profile.email || '';
      document.getElementById('hr-department').value = profile.department || '';
      document.getElementById('hr-role').value = profile.role || 'member';
    }

    // Load from localStorage
    const hrStore = getHRStore();
    const hr = hrStore[userId] || {};
    document.getElementById('hr-phone').value = hr.phone || '';
    document.getElementById('hr-contract-type').value = hr.contractType || '정규직';
    document.getElementById('hr-pay-type').value = hr.payType || '월급';
    document.getElementById('hr-pay-amount').value = hr.payAmount || '';
    document.getElementById('hr-join-date').value = hr.joinDate || '';
    document.getElementById('hr-status').value = hr.status || '재직';
    document.getElementById('hr-memo').value = hr.memo || '';
  } else {
    titleEl.textContent = '직원 등록';
  }

  openModal('hr-modal');
}

// ============================================
// Schedule (근무 스케줄)
// ============================================

const MIN_WAGE_2026 = 10320; // 2026년 최저시급
const WEEKLY_LIMIT = 52;
const OVERTIME_THRESHOLD = 40;

let scheduleYear = new Date().getFullYear();
let scheduleMonth = new Date().getMonth(); // 0-indexed

function getScheduleStore() {
  try {
    const existing = JSON.parse(localStorage.getItem('bs_schedule') || 'null');
    if (existing !== null) return existing;
  } catch (e) {}

  // Pre-populate April 2026 schedule data
  const defaults = {};
  const staff = {
    '담당PD': {1:'O',2:'연차',3:'O',4:'3',5:'휴무',6:'O',7:'O',8:'휴무',9:'O',10:'2',11:'1',12:'휴무',13:'O',14:'O',15:'휴무',16:'O',17:'O',18:'O',19:'휴무',20:'1',21:'O',22:'1',23:'연차',24:'O',25:'O',26:'휴무',27:'휴무',28:'O',29:'3',30:'O'},
    '팀원A': {1:'3',2:'1',3:'1',4:'1',5:'1',6:'1',7:'1',8:'휴무',9:'휴무',10:'연차',11:'2',12:'2',13:'2',14:'2',15:'휴무',16:'휴무',17:'3',18:'3',19:'3',20:'3',21:'3',22:'휴무',23:'1',24:'1',25:'1',26:'1',27:'1',28:'',29:'휴무',30:'O'},
    '팀원B': {1:'휴무',2:'2',3:'2',4:'2',5:'2',6:'2',7:'휴무',8:'휴무',9:'3',10:'3',11:'3',12:'3',13:'3',14:'휴무',15:'휴무',16:'1',17:'1',18:'1',19:'1',20:'1',21:'2',22:'휴무',23:'3',24:'3',25:'3',26:'3',27:'3',28:'',29:'휴무',30:'O'},
    '팀원C': {1:'휴무',2:'3',3:'3',4:'휴무',5:'3',6:'3',7:'3',8:'휴무',9:'1',10:'1',11:'휴무',12:'1',13:'1',14:'1',15:'휴무',16:'2',17:'2',18:'2',19:'2',20:'2',21:'휴무',22:'휴무',23:'2',24:'2',25:'2',26:'2',27:'휴무',28:'1',29:'O',30:'2'},
    '외주A': {1:'휴무',2:'1',3:'휴무',4:'휴무',5:'휴무',6:'휴무',7:'2',8:'휴무',9:'2',10:'4h',11:'4h',12:'휴무',13:'3',14:'휴무',15:'휴무',16:'3',17:'휴무',18:'4h',19:'휴무',20:'휴무',21:'휴무',22:'휴무',23:'휴무',24:'4h',25:'4h',26:'2',27:'2',28:'',29:'휴무',30:'휴무'}
  };

  const wednesdays = [8, 15, 22, 29];

  for (const [name, days] of Object.entries(staff)) {
    for (let d = 1; d <= 30; d++) {
      if (wednesdays.includes(d)) continue; // no entries on Wednesdays
      const val = days[d];
      if (!val || val === '휴무' || val === '연차') continue;

      const dateStr = '2026-04-' + String(d).padStart(2, '0');
      if (!defaults[dateStr]) defaults[dateStr] = [];

      let team, startTime, endTime, breakMin;

      if (val === '4h') {
        // 4h shift - use team from context or default
        team = '전체';
        startTime = '14:00';
        endTime = '18:30';
        breakMin = 30;
      } else if (val === 'O') {
        team = '전체';
        startTime = '09:00';
        endTime = '18:00';
        breakMin = 60;
      } else {
        // numeric team
        const teamNum = parseInt(val);
        team = floorNum + '팀';
        startTime = '09:00';
        endTime = '18:00';
        breakMin = 60;
      }

      defaults[dateStr].push({
        name: name,
        team: team,
        startTime: startTime,
        endTime: endTime,
        breakMin: breakMin,
        memo: ''
      });
    }
  }

  // ---- May 2026 schedule (5월) ----
  const mayStaff = {
    '담당PD': {1:'4',2:'4',3:'휴무',4:'O',5:'휴무',6:'O',7:'휴무',8:'O',9:'4',10:'O',11:'O',12:'O',13:'휴무',14:'휴무',15:'O',16:'O',17:'O',18:'O',19:'O',20:'휴무',21:'휴무',22:'O',23:'휴무',24:'휴무',25:'휴무',26:'O',27:'휴무',28:'휴무',29:'O',30:'2',31:'휴무'},
    '팀원A': {1:'1',2:'휴무',3:'4',4:'4',5:'4',6:'4',7:'4',8:'휴무',9:'휴무',10:'4',11:'4',12:'4',13:'4',14:'4',15:'휴무',16:'3',17:'4',18:'휴무',19:'1',20:'휴무',21:'휴무',22:'휴무',23:'휴무',24:'휴무',25:'휴무',26:'3',27:'휴무',28:'1',29:'휴무',30:'3',31:'3'},
    '팀원B': {1:'3',2:'3',3:'휴무',4:'휴무',5:'1',6:'1',7:'휴무',8:'휴무',9:'1',10:'1',11:'휴무',12:'휴무',13:'휴무',14:'1',15:'1',16:'1',17:'1',18:'휴무',19:'휴무',20:'휴무',21:'휴무',22:'1',23:'1',24:'1',25:'1',26:'1',27:'휴무',28:'휴무',29:'1',30:'1',31:'1'},
    '팀원C': {1:'휴무',2:'1',3:'1',4:'1',5:'휴무',6:'3',7:'1',8:'3',9:'3',10:'휴무',11:'휴무',12:'1',13:'1',14:'휴무',15:'2',16:'휴무',17:'휴무',18:'1',19:'휴무',20:'휴무',21:'1',22:'2',23:'휴무',24:'2',25:'2',26:'휴무',27:'휴무',28:'2',29:'2',30:'휴무',31:'2'},
    '외주A': {1:'휴무',2:'4h',3:'4h',4:'2',5:'4h',6:'휴무',7:'2',8:'4',9:'4h',10:'휴무',11:'1',12:'3',13:'4h',14:'4h',15:'4',16:'4',17:'휴무',18:'휴무',19:'휴무',20:'휴무',21:'2',22:'휴무',23:'4h',24:'4h',25:'4h',26:'휴무',27:'휴무',28:'휴무',29:'휴무',30:'4h',31:'4h'},
    '차진아PT': {1:'4',2:'2',3:'2',4:'휴무',5:'2',6:'2',7:'휴무',8:'2',9:'2',10:'2',11:'2',12:'휴무',13:'3',14:'3',15:'3',16:'휴무',17:'3',18:'3',19:'3',20:'휴무',21:'휴무',22:'휴무',23:'2',24:'3',25:'3',26:'2',27:'휴무',28:'3',29:'3',30:'휴무',31:'휴무'}
  };

  const mayWednesdays = [7, 14, 21, 28]; // May 2026 Wednesdays (actually 6,13,20,27 are Wednesdays in May 2026)
  // Actually check: May 1 2026 is Friday. So Wednesdays are 6,13,20,27
  const mayOffDays = [6, 13, 20, 27]; // Wednesdays in May 2026

  for (const [name, days] of Object.entries(mayStaff)) {
    for (let d = 1; d <= 31; d++) {
      if (mayOffDays.includes(d)) continue;
      const val = days[d];
      if (!val || val === '휴무' || val === '연차') continue;

      const dateStr = '2026-05-' + String(d).padStart(2, '0');
      if (!defaults[dateStr]) defaults[dateStr] = [];

      let team, startTime, endTime, breakMin;
      if (val === '4h') {
        team = '전체'; startTime = '14:00'; endTime = '18:30'; breakMin = 30;
      } else if (val === 'O') {
        team = '전체'; startTime = '09:00'; endTime = '18:00'; breakMin = 60;
      } else {
        team = parseInt(val) + '팀'; startTime = '09:00'; endTime = '18:00'; breakMin = 60;
      }

      defaults[dateStr].push({ name, team, startTime, endTime, breakMin, memo: '' });
    }
  }

  localStorage.setItem('bs_schedule', JSON.stringify(defaults));
  return defaults;
}

function setScheduleStore(data) {
  localStorage.setItem('bs_schedule', JSON.stringify(data));
}

let scheduleGridData = {}; // { staffName: { '2026-04-01': 'O', '2026-04-02': '1', ... } }

function loadSchedule() {
  const store = getScheduleStore();

  // Convert from date-based to staff-based format
  scheduleGridData = {};
  Object.entries(store).forEach(([dateStr, entries]) => {
    entries.forEach(entry => {
      if (!scheduleGridData[entry.name]) scheduleGridData[entry.name] = {};
      // Convert back to simple value
      let val = entry.team;
      if (val === '전체') val = 'O';
      else if (val.endsWith('팀')) val = val.replace('팀', '');
      if (entry.startTime === '14:00') val = '4h';
      scheduleGridData[entry.name][dateStr] = val;
    });
  });

  // Also restore 휴무/연차 from the default staff data if first load
  ['담당PD', '팀원A', '팀원B', '팀원C', '외주A'].forEach(name => {
    if (!scheduleGridData[name]) scheduleGridData[name] = {};
  });

  // 권한 체크
  getCurrentUser().then(user => {
    _currentUserIsScheduleEditor = user ? isScheduleEditor(user) : false;
    _currentUserIsManager = user ? isManager(user) : false;
    renderScheduleGrid();
  }).catch(() => renderScheduleGrid());
}

function prevMonth() {
  scheduleMonth--;
  if (scheduleMonth < 0) { scheduleMonth = 11; scheduleYear--; }
  renderScheduleGrid();
}

function nextMonth() {
  scheduleMonth++;
  if (scheduleMonth > 11) { scheduleMonth = 0; scheduleYear++; }
  renderScheduleGrid();
}

function renderScheduleGrid() {
  const label = document.getElementById('schedule-month-label');
  if (label) label.textContent = `${scheduleYear}년 ${String(scheduleMonth + 1).padStart(2, '0')}월`;

  const container = document.getElementById('schedule-grid-container');
  if (!container) return;

  const year = scheduleYear;
  const month = scheduleMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  const dayNames = ['일','월','화','수','목','금','토'];
  const staffNames = Object.keys(scheduleGridData);

  // Also load 휴무/연차 data from the defaults for this month
  // We need to check if scheduleGridData has the off-day info
  // The store only saves working entries, so we need to restore 휴무/연차 from getScheduleStore defaults
  _restoreOffDays(year, month, daysInMonth);

  let html = '<table style="font-size:14px; min-width:auto; border-collapse:collapse;">';

  // Header row: dates + day names
  html += '<thead><tr><th style="position:sticky; left:0; background:white; z-index:2; min-width:70px; padding:4px 8px; border:1px solid var(--gray-200);">이름</th>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dow = dateObj.getDay();
    const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const isWed = dow === 3;
    const isToday = dateStr === todayStr;
    const isSun = dow === 0;
    const isSat = dow === 6;

    let style = 'text-align:center; min-width:36px; padding:4px 2px; border:1px solid var(--gray-200);';
    if (isWed) style += 'background:#FEE;';
    if (isToday) style += 'border:2px solid var(--primary);';
    if (isSun) style += 'color:red;';
    if (isSat) style += 'color:blue;';

    html += '<th style="' + style + '">' + d + '<br><span style="font-size:13px; font-weight:400;">' + dayNames[dow] + '</span></th>';
  }
  html += '<th style="text-align:center; min-width:45px; padding:4px; border:1px solid var(--gray-200);">합계</th></tr></thead>';

  // Staff rows
  const canEdit = _currentUserIsScheduleEditor;
  html += '<tbody>';
  staffNames.forEach(name => {
    html += '<tr>';
    // 이름 + 삭제 버튼 (편집 권한 있을 때만)
    if (canEdit) {
      html += '<td style="position:sticky; left:0; background:white; z-index:1; font-weight:600; white-space:nowrap; padding:4px 4px 4px 8px; border:1px solid var(--gray-200);">' +
        '<span style="cursor:pointer;" onclick="renameScheduleStaff(\'' + name.replace(/'/g, "\\'") + '\')" title="이름 변경">' + name + '</span>' +
        ' <span style="cursor:pointer; color:var(--red); font-size:14px; opacity:0.5;" onclick="deleteScheduleStaff(\'' + name.replace(/'/g, "\\'") + '\')" title="삭제">✕</span>' +
        '</td>';
    } else {
      html += '<td style="position:sticky; left:0; background:white; z-index:1; font-weight:600; white-space:nowrap; padding:4px 8px; border:1px solid var(--gray-200);">' + name + '</td>';
    }

    let workDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dow = dateObj.getDay();
      const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const isWed = dow === 3;

      let val = '';
      if (isWed) {
        val = '휴';
      } else {
        val = (scheduleGridData[name] && scheduleGridData[name][dateStr]) || '';
      }

      if (val && val !== '휴' && val !== '휴무' && val !== '연차') workDays++;

      const cellStyle = getCellStyle(val, isWed);
      const cellText = getCellText(val);

      if (canEdit && !isWed) {
        html += '<td style="text-align:center; padding:2px; cursor:pointer; border:1px solid var(--gray-200); ' + cellStyle + '" ' +
          'onclick="cycleCell(\'' + name.replace(/'/g, "\\'") + '\',\'' + dateStr + '\', this)">' + cellText + '</td>';
      } else {
        html += '<td style="text-align:center; padding:2px; border:1px solid var(--gray-200); ' + cellStyle + '">' + cellText + '</td>';
      }
    }

    html += '<td style="text-align:center; font-weight:700; padding:4px; border:1px solid var(--gray-200);">' + workDays + '일</td>';
    html += '</tr>';
  });

  // Add staff row (편집 권한 있을 때만)
  if (canEdit) {
    html += '<tr><td colspan="' + (daysInMonth + 2) + '" style="text-align:center; padding:8px; cursor:pointer; color:var(--primary); font-weight:600; border:1px solid var(--gray-200);" onclick="addScheduleStaff()">+ 직원 추가</td></tr>';
  }

  html += '</tbody></table>';

  container.innerHTML = html;

  // Also update hours calculation
  saveScheduleGrid();
  if (typeof calculateScheduleHours === 'function') calculateScheduleHours();
}

function _restoreOffDays(year, month, daysInMonth) {
  // Restore 휴무/연차 entries that are in the default data but not in store
  // (since saveScheduleGrid skips 휴무/연차 when writing to store)
  const defaultStaff2026_04 = {
    '담당PD': {2:'연차',5:'휴무',8:'휴무',12:'휴무',19:'휴무',23:'연차',26:'휴무',27:'휴무'},
    '팀원A': {8:'휴무',9:'휴무',10:'연차',15:'휴무',16:'휴무',22:'휴무',29:'휴무'},
    '팀원B': {1:'휴무',7:'휴무',8:'휴무',14:'휴무',15:'휴무',22:'휴무',29:'휴무'},
    '팀원C': {1:'휴무',4:'휴무',8:'휴무',11:'휴무',15:'휴무',21:'휴무',22:'휴무',27:'휴무'},
    '외주A': {1:'휴무',3:'휴무',4:'휴무',5:'휴무',6:'휴무',8:'휴무',12:'휴무',14:'휴무',15:'휴무',17:'휴무',19:'휴무',20:'휴무',21:'휴무',22:'휴무',23:'휴무',29:'휴무',30:'휴무'}
  };
  const defaultStaff2026_05 = {
    '담당PD': {3:'휴무',5:'휴무',7:'휴무',13:'휴무',14:'휴무',20:'휴무',21:'휴무',23:'휴무',24:'휴무',25:'휴무',27:'휴무',28:'휴무',31:'휴무'},
    '팀원A': {2:'휴무',8:'휴무',9:'휴무',15:'휴무',18:'휴무',20:'휴무',21:'휴무',22:'휴무',23:'휴무',24:'휴무',25:'휴무',27:'휴무'},
    '팀원B': {3:'휴무',4:'휴무',7:'휴무',8:'휴무',11:'휴무',12:'휴무',13:'휴무',18:'휴무',19:'휴무',20:'휴무',21:'휴무',27:'휴무',28:'휴무'},
    '팀원C': {1:'휴무',5:'휴무',10:'휴무',11:'휴무',14:'휴무',16:'휴무',17:'휴무',19:'휴무',20:'휴무',25:'휴무',26:'휴무',27:'휴무',30:'휴무'},
    '외주A': {1:'휴무',6:'휴무',10:'휴무',17:'휴무',18:'휴무',19:'휴무',20:'휴무',22:'휴무',25:'휴무',26:'휴무',27:'휴무',28:'휴무',29:'휴무'},
    '차진아PT': {4:'휴무',7:'휴무',12:'휴무',16:'휴무',20:'휴무',21:'휴무',22:'휴무',27:'휴무',30:'휴무',31:'휴무'}
  };

  let defaults = null;
  if (year === 2026 && month === 3) defaults = defaultStaff2026_04;
  else if (year === 2026 && month === 4) defaults = defaultStaff2026_05;

  if (!defaults) return;

  for (const [name, days] of Object.entries(defaults)) {
    if (!scheduleGridData[name]) scheduleGridData[name] = {};
    for (const [d, val] of Object.entries(days)) {
      const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(parseInt(d)).padStart(2, '0');
      // Only set if not already set by user
      if (!scheduleGridData[name][dateStr]) {
        scheduleGridData[name][dateStr] = val;
      }
    }
  }
}

function getCellStyle(val, isWed) {
  if (isWed || val === '휴' || val === '휴무') return 'background:#F5F5F5; color:#999;';
  if (val === '연차') return 'background:#FEF2F2; color:#DC2626;';
  if (val === '4h') return 'background:#FFFBEB; color:#B8860B; font-weight:600;';
  if (val === 'O') return 'background:rgba(46,196,182,0.1); color:var(--primary); font-weight:700;';
  if (val === '1') return 'background:rgba(37,99,235,0.1); color:#2563EB; font-weight:700;';
  if (val === '2') return 'background:rgba(22,163,74,0.1); color:#16A34A; font-weight:700;';
  if (val === '3') return 'background:rgba(234,88,12,0.1); color:#EA580C; font-weight:700;';
  if (val === '4') return 'background:rgba(147,51,234,0.1); color:#9333EA; font-weight:700;';
  return '';
}

function getCellText(val) {
  if (!val) return '';
  if (val === '휴' || val === '휴무') return '휴';
  return val;
}

const CELL_CYCLE = ['', '1', '2', '3', '4', 'O', '4h', '휴무', '연차'];

function cycleCell(name, dateStr, td) {
  const current = (scheduleGridData[name] && scheduleGridData[name][dateStr]) || '';
  const idx = CELL_CYCLE.indexOf(current);
  const next = CELL_CYCLE[(idx + 1) % CELL_CYCLE.length];

  if (!scheduleGridData[name]) scheduleGridData[name] = {};
  scheduleGridData[name][dateStr] = next;

  td.textContent = getCellText(next);
  td.style.cssText = 'text-align:center; padding:2px; cursor:pointer; border:1px solid var(--gray-200); ' + getCellStyle(next, false);

  // Update work day count for this row
  _updateRowTotal(td);

  // Auto-save
  saveScheduleGrid();
  if (typeof calculateScheduleHours === 'function') calculateScheduleHours();
}

function _updateRowTotal(td) {
  const row = td.parentElement;
  if (!row) return;
  const cells = row.querySelectorAll('td');
  const nameCell = cells[0];
  const name = nameCell.textContent;
  const year = scheduleYear;
  const month = scheduleMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow === 3) continue; // Wednesday off
    const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const val = (scheduleGridData[name] && scheduleGridData[name][dateStr]) || '';
    if (val && val !== '휴무' && val !== '연차') workDays++;
  }
  const lastCell = cells[cells.length - 1];
  if (lastCell) lastCell.textContent = workDays + '일';
}

function saveScheduleGrid() {
  // Convert staff-based format back to date-based format for localStorage
  const store = {};

  Object.entries(scheduleGridData).forEach(([name, days]) => {
    Object.entries(days).forEach(([dateStr, val]) => {
      if (!val || val === '휴무' || val === '연차' || val === '휴') return;

      if (!store[dateStr]) store[dateStr] = [];

      let team, startTime, endTime, breakMin;
      if (val === '4h') {
        team = '전체'; startTime = '14:00'; endTime = '18:30'; breakMin = 30;
      } else if (val === 'O') {
        team = '전체'; startTime = '09:00'; endTime = '18:00'; breakMin = 60;
      } else {
        team = val + '팀'; startTime = '09:00'; endTime = '18:00'; breakMin = 60;
      }

      store[dateStr].push({ name, team, startTime, endTime, breakMin, memo: '' });
    });
  });

  setScheduleStore(store);
}

function addScheduleStaff() {
  const name = prompt('직원 이름을 입력하세요:');
  if (!name || !name.trim()) return;
  scheduleGridData[name.trim()] = {};
  saveScheduleGrid();
  renderScheduleGrid();
}

function deleteScheduleStaff(name) {
  if (!confirm(name + ' 을(를) 스케줄에서 삭제할까요?')) return;
  delete scheduleGridData[name];
  saveScheduleGrid();
  renderScheduleGrid();
}

function renameScheduleStaff(oldName) {
  const newName = prompt('새 이름을 입력하세요:', oldName);
  if (!newName || !newName.trim() || newName.trim() === oldName) return;
  scheduleGridData[newName.trim()] = scheduleGridData[oldName];
  delete scheduleGridData[oldName];
  saveScheduleGrid();
  renderScheduleGrid();
}

// 4월/5월 스케줄 초기화 (담당 PD 원본)
function resetScheduleDefaults() {
  if (!confirm('4월/5월 스케줄을 원본(담당 PD 작성)으로 초기화할까요? 현재 수정사항이 사라집니다.')) return;
  localStorage.removeItem('bs_schedule');
  getScheduleStore(); // re-populate defaults
  loadSchedule();
  showToast('4월/5월 스케줄이 초기화되었습니다.', 'success');
}

function downloadScheduleExcel() {
  const year = scheduleYear;
  const month = scheduleMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayNames = ['일','월','화','수','목','금','토'];
  const monthStr = year + '년 ' + (month + 1) + '월';

  const header1 = ['이름'];
  const header2 = [''];
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    header1.push(d);
    header2.push(dayNames[dow]);
  }
  header1.push('합계');
  header2.push('');

  const rows = [
    [monthStr + ' 근무스케줄 (09:00-18:00 / 4h: 14:00-18:30)'],
    [],
    header1,
    header2
  ];

  Object.entries(scheduleGridData).forEach(([name, days]) => {
    const row = [name];
    let workDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const dow = new Date(year, month, d).getDay();
      let val = dow === 3 ? '휴무' : (days[dateStr] || '');
      if (val && val !== '휴무' && val !== '휴' && val !== '연차') workDays++;
      row.push(val);
    }
    row.push(workDays + '일');
    rows.push(row);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:10}].concat(Array(daysInMonth).fill({wch:5})).concat([{wch:6}]);
  XLSX.utils.book_append_sheet(wb, ws, '근무스케줄');
  XLSX.writeFile(wb, '버치사운드_근무스케줄_' + monthStr.replace(/ /g, '') + '.xlsx');
  showToast('스케줄 엑셀 다운로드 완료', 'success');
}

function calculateScheduleHours() {
  const tbody = document.getElementById('schedule-hours-table');
  if (!tbody) return;

  const store = getScheduleStore();
  const hrStore = getHRStore();
  const now = new Date();
  const year = scheduleYear;
  const month = scheduleMonth;

  // Get all entries for the current displayed month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const workerData = {}; // { name: { weekHours, monthHours, dailyDetails: [{date, hours}] } }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const entries = store[dateStr] || [];
    entries.forEach(entry => {
      if (!workerData[entry.name]) {
        workerData[entry.name] = { weekHours: 0, monthHours: 0, dailyDetails: [], userId: entry.userId || null };
      }
      const [sh, sm] = entry.startTime.split(':').map(Number);
      const [eh, em] = entry.endTime.split(':').map(Number);
      const totalMin = (eh * 60 + em) - (sh * 60 + sm) - (entry.breakMin || 0);
      const hours = Math.max(0, totalMin / 60);
      workerData[entry.name].monthHours += hours;
      workerData[entry.name].dailyDetails.push({ date: dateStr, hours: hours });
    });
  }

  // Calculate current week hours (Mon-Sun containing today or the displayed month's context)
  const today = new Date();
  // Find the Monday of the current week
  const dayOfWeek = today.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mondayStr = monday.toISOString().split('T')[0];
  const sundayStr = sunday.toISOString().split('T')[0];

  // Recalculate weekly hours for each worker
  for (const name in workerData) {
    let weekHours = 0;
    workerData[name].dailyDetails.forEach(d => {
      if (d.date >= mondayStr && d.date <= sundayStr) {
        weekHours += d.hours;
      }
    });
    workerData[name].weekHours = weekHours;
  }

  // Get hourly rates from HR data
  function getHourlyRate(workerName, userId) {
    // Try to find by userId first, then by name match
    for (const id in hrStore) {
      const hr = hrStore[id];
      if (hr.payType === '시급' && hr.payAmount) {
        if (id === userId) return hr.payAmount;
        if (hr.name && hr.name === workerName) return hr.payAmount;
      }
    }
    return MIN_WAGE_2026;
  }

  const names = Object.keys(workerData).sort();
  if (names.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">이번 달 스케줄 데이터가 없습니다.</td></tr>';
    return;
  }

  tbody.innerHTML = names.map(name => {
    const data = workerData[name];
    const weekHours = data.weekHours;
    const monthHours = data.monthHours;
    const hourlyRate = getHourlyRate(name, data.userId);

    // Calculate estimated monthly pay with overtime
    // We need to calculate week by week for the whole month
    let totalPay = 0;
    let totalWeeklyHolidayPay = 0;

    // Group days by ISO week
    const weekMap = {};
    data.dailyDetails.forEach(d => {
      const dt = new Date(d.date);
      // Get ISO week start (Monday)
      const dow = dt.getDay();
      const monOff = dow === 0 ? -6 : 1 - dow;
      const wkMon = new Date(dt);
      wkMon.setDate(dt.getDate() + monOff);
      const wkKey = wkMon.toISOString().split('T')[0];
      if (!weekMap[wkKey]) weekMap[wkKey] = 0;
      weekMap[wkKey] += d.hours;
    });

    for (const wkKey in weekMap) {
      const wkHrs = weekMap[wkKey];
      const regular = Math.min(wkHrs, OVERTIME_THRESHOLD);
      const overtime = Math.max(0, Math.min(wkHrs, WEEKLY_LIMIT) - OVERTIME_THRESHOLD);
      const overLimit = Math.max(0, wkHrs - WEEKLY_LIMIT);
      totalPay += regular * hourlyRate;
      totalPay += overtime * hourlyRate * 1.5;
      totalPay += overLimit * hourlyRate * 1.5; // over 52 still gets overtime rate
      // Weekly holiday pay: if >= 15 hours, add proportional
      if (wkHrs >= 15) {
        totalWeeklyHolidayPay += (wkHrs / 40) * 8 * hourlyRate;
      }
    }
    totalPay += totalWeeklyHolidayPay;

    // Status badge
    let statusHtml = '';
    if (weekHours > WEEKLY_LIMIT) {
      statusHtml = '<span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:14px; font-weight:700; background:#fecaca; color:#dc2626;">&#9888;&#65039; 52시간 초과</span>';
    } else if (weekHours > OVERTIME_THRESHOLD) {
      statusHtml = '<span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:14px; font-weight:700; background:#fef3c7; color:#b45309;">연장근무 발생</span>';
    } else {
      statusHtml = '<span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:14px; font-weight:700; background:#d1fae5; color:#047857;">정상</span>';
    }

    // Week hours color
    let weekColor = '#047857'; // green
    if (weekHours > WEEKLY_LIMIT) weekColor = '#dc2626'; // red
    else if (weekHours > OVERTIME_THRESHOLD) weekColor = '#b45309'; // yellow/amber

    return `<tr>
      <td><strong>${name}</strong></td>
      <td style="font-weight:700; color:${weekColor};">${weekHours.toFixed(1)}시간</td>
      <td>${monthHours.toFixed(1)}시간</td>
      ${_currentUserIsScheduleEditor ? `<td>${hourlyRate.toLocaleString()}원</td>
      <td style="font-weight:700;">${Math.round(totalPay).toLocaleString()}원</td>` : ''}
      <td>${statusHtml}</td>
    </tr>`;
  }).join('');

  // 시급/급여 헤더도 권한에 따라 숨기기
  const hoursTable = tbody.closest('table');
  if (hoursTable) {
    const ths = hoursTable.querySelectorAll('thead th');
    if (ths.length >= 6 && !_currentUserIsScheduleEditor) {
      ths[3].style.display = 'none'; // 시급
      ths[4].style.display = 'none'; // 예상 월급
    }
  }
}

// updateScheduleModalHours and deleteScheduleEntry removed - replaced by grid editor

// ============================================
// Resources (자료실)
// ============================================

let currentResourceFilter = '전체';

function getResourceStore() {
  try {
    const data = JSON.parse(localStorage.getItem('bs_resources') || 'null');
    if (data) return data;
  } catch (e) {}

  // Default entries
  const defaults = [
    { title: '📁 버치사운드 공유 드라이브', category: '경영자료', url: 'https://drive.google.com/drive/folders/1n0H2NgUChqCuPI-GtPGfuN1UIjRh1N3u?usp=sharing', memo: '전체 경영자료 구글 드라이브', date: '2026-04-05' },
    { title: '회의록 양식', category: '양식', url: '', memo: '', date: '2026-04-01' },
    { title: '연차사용현황', category: '양식', url: '', memo: '', date: '2026-04-01' },
    { title: '입고확인증', category: '양식', url: '', memo: '', date: '2026-04-01' },
    { title: '출고확인증', category: '양식', url: '', memo: '', date: '2026-04-01' },
    { title: '발주서', category: '양식', url: '', memo: '', date: '2026-04-01' },
    { title: '2026 일정&업무 요약', category: '경영자료', url: '', memo: '', date: '2026-04-01' }
  ];
  localStorage.setItem('bs_resources', JSON.stringify(defaults));
  return defaults;
}

function setResourceStore(data) {
  localStorage.setItem('bs_resources', JSON.stringify(data));
}

function loadResources() {
  renderResources();
}

function filterResources(category, btnEl) {
  currentResourceFilter = category;
  document.querySelectorAll('.resource-tab').forEach(el => {
    el.style.background = 'transparent';
    el.style.color = 'var(--gray-600)';
  });
  if (btnEl) {
    btnEl.style.background = 'var(--primary)';
    btnEl.style.color = 'white';
  }
  renderResources();
}

function renderResources() {
  const store = getResourceStore();
  const tbody = document.getElementById('resource-list');
  const countEl = document.getElementById('resource-count');
  if (!tbody) return;

  const filtered = currentResourceFilter === '전체' ? store : store.filter(r => r.category === currentResourceFilter);

  if (countEl) countEl.textContent = filtered.length + '건';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">등록된 자료가 없습니다.</td></tr>';
    return;
  }

  const categoryColors = {
    '양식': 'var(--blue)',
    '회의록': 'var(--green)',
    '경영자료': 'var(--yellow)',
    '기타': 'var(--gray-500)'
  };

  tbody.innerHTML = filtered.map((r, idx) => {
    const realIdx = store.indexOf(r);
    const color = categoryColors[r.category] || 'var(--gray-500)';
    const linkHtml = r.url
      ? `<a href="${r.url}" target="_blank" style="color:var(--primary); text-decoration:none; font-size:14px;">열기</a>`
      : '<span style="font-size:14px; color:var(--gray-400);">미등록</span>';

    return `<tr>
      <td><strong>${r.title}</strong>${r.memo ? '<br><span style="font-size:14px; color:var(--gray-400);">' + r.memo + '</span>' : ''}</td>
      <td><span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:14px; font-weight:600; background:${color}15; color:${color};">${r.category}</span></td>
      <td style="font-size:14px; color:var(--gray-500);">${r.date || '-'}</td>
      <td>${linkHtml}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="deleteResource(${realIdx})" style="color:var(--red); font-size:14px;">삭제</button></td>
    </tr>`;
  }).join('');
}

function saveResource() {
  const title = document.getElementById('resource-title').value.trim();
  const category = document.getElementById('resource-category').value;
  const url = document.getElementById('resource-url').value.trim();
  const memo = document.getElementById('resource-memo').value.trim();

  if (!title) { showToast('제목을 입력해주세요.', 'error'); return; }

  const store = getResourceStore();
  store.push({
    title: title,
    category: category,
    url: url,
    memo: memo,
    date: new Date().toISOString().split('T')[0]
  });
  setResourceStore(store);

  closeModal('resource-modal');
  document.getElementById('resource-title').value = '';
  document.getElementById('resource-url').value = '';
  document.getElementById('resource-memo').value = '';
  showToast('자료가 등록되었습니다.', 'success');
  renderResources();
}

function deleteResource(index) {
  if (!confirm('이 자료를 삭제하시겠습니까?')) return;
  const store = getResourceStore();
  store.splice(index, 1);
  setResourceStore(store);
  showToast('자료가 삭제되었습니다.', 'success');
  renderResources();
}

// Save HR data
async function saveHRData() {
  const userId = document.getElementById('hr-edit-user-id').value;
  const name = document.getElementById('hr-name').value.trim();
  const email = document.getElementById('hr-email').value.trim();
  const phone = document.getElementById('hr-phone').value.trim();
  const department = document.getElementById('hr-department').value;
  const role = document.getElementById('hr-role').value;
  const contractType = document.getElementById('hr-contract-type').value;
  const payType = document.getElementById('hr-pay-type').value;
  const payAmount = parseInt(document.getElementById('hr-pay-amount').value) || 0;
  const joinDate = document.getElementById('hr-join-date').value;
  const status = document.getElementById('hr-status').value;
  const memo = document.getElementById('hr-memo').value.trim();

  if (!name) {
    showToast('이름을 입력해주세요.', 'error');
    return;
  }

  if (userId) {
    // Update existing profile in Supabase
    const { error } = await sb
      .from('profiles')
      .update({ name, department, role })
      .eq('id', userId);

    if (error) {
      showToast('프로필 업데이트 실패: ' + error.message, 'error');
      return;
    }

    // Save extra HR data to localStorage
    const hrStore = getHRStore();
    hrStore[userId] = {
      phone,
      contractType,
      payType,
      payAmount,
      joinDate,
      status,
      memo,
      totalLeave: (hrStore[userId] && hrStore[userId].totalLeave) || 15,
      usedLeave: (hrStore[userId] && hrStore[userId].usedLeave) || 0
    };
    setHRStore(hrStore);

    showToast('직원 정보가 수정되었습니다.', 'success');
  } else {
    // New employee - cannot create Supabase auth user from client
    // Store as pending in localStorage
    const hrStore = getHRStore();
    const tempId = 'temp_' + Date.now();
    hrStore[tempId] = {
      name,
      email,
      phone,
      department,
      role,
      contractType,
      payType,
      payAmount,
      joinDate,
      status,
      memo,
      totalLeave: 15,
      usedLeave: 0,
      isPending: true
    };
    setHRStore(hrStore);

    showToast('직원이 임시 등록되었습니다. (계정 생성은 별도 필요)', 'info');
  }

  closeModal('hr-modal');
  loadHRList();
}

// ============================================
// Project Management (프로젝트 관리)
// ============================================

function getProjectStore() {
  try {
    const existing = JSON.parse(localStorage.getItem('bs_projects') || 'null');
    if (existing !== null) return existing;
  } catch (e) {}

  // 기본 프로젝트: 계층형 투어 + 페스티벌
  const defaults = [
    { id: 'proj_tour_2027', name: 'Asia Tour 2027', ip: 'Global Concert Tour', status: 'active', startDate: '2027-03-01', endDate: '2027-06-30', projectType: 'tour', location: '아시아 5개국', parentId: '', requiredStaff: 20, assignedStaff: '', budgetInterior: 0, budgetProduction: 500000000, budgetGiveaway: 50000000, budgetOther: 100000000, targetRevenue: 5000000000, productMemo: '아시아 5개국 순회 투어', memo: '', workers: [], costs: [], createdAt: new Date().toISOString() },
    { id: 'proj_seoul', name: '서울 공연', ip: 'Asia Tour', status: 'active', startDate: '2027-03-15', endDate: '2027-03-16', projectType: 'concert', location: '서울 KSPO DOME', parentId: 'proj_tour_2027', requiredStaff: 5, assignedStaff: '', budgetInterior: 0, budgetProduction: 100000000, budgetGiveaway: 10000000, budgetOther: 20000000, targetRevenue: 1000000000, productMemo: '', memo: 'KSPO DOME 대관 확정', workers: [], costs: [], createdAt: new Date().toISOString() },
    { id: 'proj_singapore', name: '싱가포르 공연', ip: 'Asia Tour', status: 'planning', startDate: '2027-04-10', endDate: '2027-04-11', projectType: 'concert', location: '싱가포르 Marina Bay Sands', parentId: 'proj_tour_2027', requiredStaff: 5, assignedStaff: '', budgetInterior: 0, budgetProduction: 150000000, budgetGiveaway: 10000000, budgetOther: 30000000, targetRevenue: 1200000000, productMemo: '', memo: '공연장 계약 조율 중', workers: [], costs: [], createdAt: new Date().toISOString() },
    { id: 'proj_tokyo', name: '도쿄 공연', ip: 'Asia Tour', status: 'planning', startDate: '2027-05-01', endDate: '2027-05-02', projectType: 'concert', location: '도쿄 Budokan', parentId: 'proj_tour_2027', requiredStaff: 5, assignedStaff: '', budgetInterior: 0, budgetProduction: 120000000, budgetGiveaway: 10000000, budgetOther: 25000000, targetRevenue: 1100000000, productMemo: '', memo: '', workers: [], costs: [], createdAt: new Date().toISOString() },
    { id: 'proj_bangkok', name: '방콕 공연', ip: 'Asia Tour', status: 'planning', startDate: '2027-05-20', endDate: '2027-05-21', projectType: 'concert', location: '방콕 Impact Arena', parentId: 'proj_tour_2027', requiredStaff: 4, assignedStaff: '', budgetInterior: 0, budgetProduction: 80000000, budgetGiveaway: 8000000, budgetOther: 15000000, targetRevenue: 800000000, productMemo: '', memo: '', workers: [], costs: [], createdAt: new Date().toISOString() },
    { id: 'proj_jakarta', name: '자카르타 공연', ip: 'Asia Tour', status: 'planning', startDate: '2027-06-10', endDate: '2027-06-11', projectType: 'concert', location: '자카르타 ICE BSD', parentId: 'proj_tour_2027', requiredStaff: 4, assignedStaff: '', budgetInterior: 0, budgetProduction: 70000000, budgetGiveaway: 8000000, budgetOther: 15000000, targetRevenue: 700000000, productMemo: '', memo: '', workers: [], costs: [], createdAt: new Date().toISOString() },
    { id: 'proj_festival', name: '2026 Summer Music Festival', ip: 'Global Music Festival', status: 'active', startDate: '2026-07-15', endDate: '2026-07-17', projectType: 'festival', location: '서울 올림픽공원', parentId: '', requiredStaff: 15, assignedStaff: '', budgetInterior: 50000000, budgetProduction: 300000000, budgetGiveaway: 30000000, budgetOther: 50000000, targetRevenue: 3000000000, productMemo: '3일간 야외 페스티벌', memo: '', workers: [], costs: [], createdAt: new Date().toISOString() }
  ];

  localStorage.setItem('bs_projects', JSON.stringify(defaults));

  return defaults;
}

function setProjectStore(data) {
  localStorage.setItem('bs_projects', JSON.stringify(data));
}

function loadProjects() {
  const projects = getProjectStore();

  // Update stats
  const activeCount = projects.filter(p => p.status === 'active').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const totalWorkers = projects.filter(p => p.status === 'active').reduce((sum, p) => sum + (p.workers ? p.workers.length : 0), 0);

  // Total planned budget for active projects
  const activeBudget = projects.filter(p => p.status === 'active').reduce((sum, p) => {
    return sum + (p.budgetInterior || 0) + (p.budgetProduction || 0) + (p.budgetGiveaway || 0) + (p.budgetOther || 0);
  }, 0);

  const el = (id) => document.getElementById(id);
  if (el('proj-stat-active')) el('proj-stat-active').textContent = activeCount;
  if (el('proj-stat-budget')) el('proj-stat-budget').textContent = activeBudget.toLocaleString() + '원';
  if (el('proj-stat-workers')) el('proj-stat-workers').textContent = totalWorkers + '명';
  if (el('proj-stat-completed')) el('proj-stat-completed').textContent = completedCount;

  // Render using hierarchical view
  renderProjectList(projects);
}

function renderProjectList(projects) {
  const container = document.getElementById('project-list');
  if (!container) return;

  const parents = projects.filter(p => !p.parentId);
  const children = projects.filter(p => p.parentId);

  if (projects.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>프로젝트를 등록하세요.</p></div>';
    return;
  }

  const typeLabels = { tour: '글로벌 투어', concert: '단독 공연', festival: '페스티벌', showcase: '쇼케이스', exhibition: '전시', production: '제작', other: '기타' };
  const typeColors = { tour: '#9333EA', concert: '#2563EB', festival: '#EA580C', showcase: '#16A34A', exhibition: '#B8860B', production: '#6B7280', other: '#6B7280' };
  const statusLabels = { planning: '기획중', preparing: '준비중', active: '진행중', completed: '완료', cancelled: '취소' };

  let html = '';

  // Standalone projects (no parent, no children)
  const standalones = parents.filter(p => !children.some(c => c.parentId === p.id));
  // Parent projects (have children)
  const parentWithChildren = parents.filter(p => children.some(c => c.parentId === p.id));

  // Render parent projects with children first
  parentWithChildren.forEach(function(parent) {
    const myChildren = children.filter(c => c.parentId === parent.id);
    const totalBudget = [parent].concat(myChildren).reduce(function(sum, p) { return sum + (parseInt(p.budgetInterior)||0) + (parseInt(p.budgetProduction)||0) + (parseInt(p.budgetGiveaway)||0) + (parseInt(p.budgetOther)||0); }, 0);
    const type = typeLabels[parent.projectType] || '프로젝트';
    const color = typeColors[parent.projectType] || '#6B7280';

    html += '<div class="card" style="margin-bottom:16px; border-left:4px solid ' + color + ';">' +
      '<div class="card-body" style="padding:16px 20px; cursor:pointer;" onclick="toggleProjectChildren(\'' + parent.id + '\')">' +
        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
          '<div>' +
            '<div style="display:flex; align-items:center; gap:8px;">' +
              '<span style="background:' + color + '20; color:' + color + '; padding:2px 8px; border-radius:4px; font-size:14px; font-weight:700;">' + type + '</span>' +
              '<span class="badge ' + (parent.status === 'active' ? 'badge-approved' : parent.status === 'planning' || parent.status === 'preparing' ? 'badge-pending' : 'badge-rejected') + '">' + (statusLabels[parent.status] || parent.status) + '</span>' +
            '</div>' +
            '<div style="font-size:18px; font-weight:800; margin-top:6px;">' + parent.name + '</div>' +
            '<div style="font-size:14px; color:var(--gray-500); margin-top:2px;">' + (parent.location || '') + ' | ' + (parent.startDate || '') + ' ~ ' + (parent.endDate || '') + '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="font-size:14px; color:var(--gray-500);">하위 프로젝트 ' + myChildren.length + '개</div>' +
            '<div style="font-size:16px; font-weight:700; color:' + color + ';">\u20A9' + totalBudget.toLocaleString() + '</div>' +
            '<div style="font-size:20px; color:var(--gray-400);" id="proj-arrow-' + parent.id + '">\u25BC</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div id="proj-children-' + parent.id + '" style="display:none; border-top:1px solid var(--gray-100);">';

    myChildren.forEach(function(child) {
      var cType = typeLabels[child.projectType] || '공연';
      var cColor = typeColors[child.projectType] || '#6B7280';
      html += '<div style="padding:12px 20px 12px 36px; border-bottom:1px solid var(--gray-50); cursor:pointer; display:flex; justify-content:space-between; align-items:center;" onclick="event.stopPropagation(); toggleProjectDetail(\'' + child.id + '\')">' +
        '<div>' +
          '<div style="display:flex; align-items:center; gap:6px;">' +
            '<span style="color:var(--gray-400);">\u2514</span>' +
            '<span style="font-weight:600;">' + child.name + '</span>' +
            '<span class="badge ' + (child.status === 'active' ? 'badge-approved' : child.status === 'planning' || child.status === 'preparing' ? 'badge-pending' : 'badge-rejected') + '" style="font-size:13px;">' + (statusLabels[child.status] || child.status) + '</span>' +
          '</div>' +
          '<div style="font-size:14px; color:var(--gray-500); margin-left:20px;">' + (child.location || '') + ' | ' + (child.startDate || '') + ' ~ ' + (child.endDate || '') + '</div>' +
        '</div>' +
        '<div style="font-size:14px; font-weight:600;">\u20A9' + ((parseInt(child.budgetInterior)||0)+(parseInt(child.budgetProduction)||0)+(parseInt(child.budgetGiveaway)||0)+(parseInt(child.budgetOther)||0)).toLocaleString() + '</div>' +
      '</div>';
    });

    html += '<div style="padding:8px 20px 8px 36px;">' +
      '<button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); openProjectModal(null, \'' + parent.id + '\')">+ 하위 프로젝트 추가</button>' +
    '</div>';

    html += '</div>' +
      // Detail views for parent
      '<div id="project-detail-' + parent.id + '" style="display:none; border-top:1px solid var(--gray-100); padding:16px 20px;">' + renderProjectDetailTabs(parent) + '</div>' +
    '</div>';

    // Detail views for children (rendered after parent card)
    myChildren.forEach(function(child) {
      html += '<div id="project-detail-' + child.id + '" style="display:none; margin-bottom:16px; margin-left:24px; border:1px solid var(--gray-200); border-radius:8px; padding:16px 20px;">' + renderProjectDetailTabs(child) + '</div>';
    });
  });

  // Render standalone projects
  standalones.forEach(function(proj) {
    var type = typeLabels[proj.projectType] || '프로젝트';
    var color = typeColors[proj.projectType] || '#6B7280';
    var budget = (parseInt(proj.budgetInterior)||0)+(parseInt(proj.budgetProduction)||0)+(parseInt(proj.budgetGiveaway)||0)+(parseInt(proj.budgetOther)||0);

    html += '<div class="card" style="margin-bottom:12px; cursor:pointer; border-left:3px solid ' + color + ';" onclick="toggleProjectDetail(\'' + proj.id + '\')">' +
      '<div class="card-body" style="padding:14px 20px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
          '<div>' +
            '<div style="display:flex; align-items:center; gap:8px;">' +
              '<span style="background:' + color + '20; color:' + color + '; padding:2px 8px; border-radius:4px; font-size:14px; font-weight:700;">' + type + '</span>' +
              '<span class="badge ' + (proj.status === 'active' ? 'badge-approved' : proj.status === 'planning' || proj.status === 'preparing' ? 'badge-pending' : 'badge-rejected') + '">' + (statusLabels[proj.status] || proj.status) + '</span>' +
            '</div>' +
            '<div style="font-size:16px; font-weight:700; margin-top:4px;">' + proj.name + '</div>' +
            '<div style="font-size:14px; color:var(--gray-500);">' + (proj.location || '') + ' | ' + (proj.startDate || '') + ' ~ ' + (proj.endDate || '') + '</div>' +
          '</div>' +
          '<div style="font-size:14px; font-weight:700;">\u20A9' + budget.toLocaleString() + '</div>' +
        '</div>' +
      '</div>' +
      '<div id="project-detail-' + proj.id + '" style="display:none; border-top:1px solid var(--gray-100); padding:16px 20px;">' + renderProjectDetailTabs(proj) + '</div>' +
    '</div>';
  });

  // Orphan children (parent deleted)
  var orphans = children.filter(function(c) { return !parents.some(function(p) { return p.id === c.parentId; }); });
  orphans.forEach(function(proj) {
    html += '<div class="card" style="margin-bottom:12px; cursor:pointer;" onclick="toggleProjectDetail(\'' + proj.id + '\')">' +
      '<div class="card-body" style="padding:14px 20px;">' +
        '<div style="font-size:16px; font-weight:700;">' + proj.name + '</div>' +
        '<div style="font-size:14px; color:var(--gray-500);">' + (proj.location || '') + '</div>' +
      '</div>' +
      '<div id="project-detail-' + proj.id + '" style="display:none; border-top:1px solid var(--gray-100); padding:16px 20px;">' + renderProjectDetailTabs(proj) + '</div>' +
    '</div>';
  });

  container.innerHTML = html;
}

function renderProjectDetailTabs(proj) {
  var workerCount = proj.workers ? proj.workers.length : 0;
  var laborCost = calculateProjectCost(proj);
  var html = '';
  html += '<div style="display:flex; gap:4px; margin-bottom:16px; border-bottom:1px solid var(--gray-100); padding-bottom:8px;">' +
    '<button class="btn btn-ghost btn-sm proj-tab-btn" onclick="event.stopPropagation(); switchProjectTab(\'' + proj.id + '\', \'overview\')" style="font-weight:600; background:var(--primary); color:white;" data-proj-tab="' + proj.id + '-overview">개요</button>' +
    '<button class="btn btn-ghost btn-sm proj-tab-btn" onclick="event.stopPropagation(); switchProjectTab(\'' + proj.id + '\', \'workers\')" data-proj-tab="' + proj.id + '-workers">인력</button>' +
    '<button class="btn btn-ghost btn-sm proj-tab-btn" onclick="event.stopPropagation(); switchProjectTab(\'' + proj.id + '\', \'revenue\')" data-proj-tab="' + proj.id + '-revenue">매출</button>' +
    '<button class="btn btn-ghost btn-sm proj-tab-btn" onclick="event.stopPropagation(); switchProjectTab(\'' + proj.id + '\', \'costs\')" data-proj-tab="' + proj.id + '-costs">비용</button>' +
    '<button class="btn btn-ghost btn-sm proj-tab-btn" onclick="event.stopPropagation(); switchProjectTab(\'' + proj.id + '\', \'memo\')" data-proj-tab="' + proj.id + '-memo">메모</button>' +
  '</div>';
  // Overview tab
  html += '<div id="proj-tab-' + proj.id + '-overview">' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:14px;">' +
      '<div style="background:var(--gray-50); padding:12px 16px; border-radius:8px;"><div style="font-size:14px; color:var(--gray-500); font-weight:600;">프로젝트명</div><div style="font-weight:700; margin-top:4px;">' + proj.name + '</div></div>' +
      '<div style="background:var(--gray-50); padding:12px 16px; border-radius:8px;"><div style="font-size:14px; color:var(--gray-500); font-weight:600;">IP/작품명</div><div style="font-weight:700; margin-top:4px;">' + (proj.ip || '-') + '</div></div>' +
      '<div style="background:var(--gray-50); padding:12px 16px; border-radius:8px;"><div style="font-size:14px; color:var(--gray-500); font-weight:600;">기간</div><div style="font-weight:700; margin-top:4px;">' + (proj.startDate || '-') + ' ~ ' + (proj.endDate || '-') + '</div></div>' +
      '<div style="background:var(--gray-50); padding:12px 16px; border-radius:8px;"><div style="font-size:14px; color:var(--gray-500); font-weight:600;">국가/도시</div><div style="font-weight:700; margin-top:4px;">' + (proj.location || '-') + '</div></div>' +
      '<div style="background:var(--gray-50); padding:12px 16px; border-radius:8px;"><div style="font-size:14px; color:var(--gray-500); font-weight:600;">투입 인력</div><div style="font-weight:700; margin-top:4px;">' + workerCount + '명</div></div>' +
      '<div style="background:var(--gray-50); padding:12px 16px; border-radius:8px;"><div style="font-size:14px; color:var(--gray-500); font-weight:600;">예상 인건비</div><div style="font-weight:700; margin-top:4px;">' + laborCost.toLocaleString() + '원</div></div>' +
    '</div>' +
    '<div style="margin-top:16px; display:flex; gap:8px;">' +
      '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); openProjectModal(\'' + proj.id + '\')" style="color:var(--primary);">수정</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); deleteProject(\'' + proj.id + '\')" style="color:var(--red);">삭제</button>' +
    '</div>' +
  '</div>';
  // Workers tab
  html += '<div id="proj-tab-' + proj.id + '-workers" style="display:none;">' +
    '<div style="margin-bottom:12px;"><button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openWorkerModal(\'' + proj.id + '\')">+ 인력 배정</button></div>';
  if (workerCount === 0) {
    html += '<div class="empty-state"><p>배정된 인력이 없습니다.</p></div>';
  } else {
    html += '<div class="table-container"><table><thead><tr><th>유형</th><th>이름/회사</th><th>역할</th><th>계약금액</th><th>상태</th><th>메모</th><th>삭제</th></tr></thead><tbody>';
    proj.workers.forEach(function(w, wi) {
      var typeColorMap = { '내부인력': '#3b82f6', '외주': '#10b981', '파트너사': '#f59e0b', '아티스트': '#ef4444' };
      var typeBgMap = { '내부인력': 'rgba(59,130,246,0.1)', '외주': 'rgba(16,185,129,0.1)', '파트너사': 'rgba(245,158,11,0.1)', '아티스트': 'rgba(239,68,68,0.1)' };
      var typeColor = typeColorMap[w.type] || '#9ca3af';
      var typeBg = typeBgMap[w.type] || 'rgba(156,163,175,0.1)';
      var wStatusMap = { '섭외중': '#f59e0b', '확정': '#3b82f6', '진행중': '#10b981', '완료': '#9ca3af' };
      var statusColor = wStatusMap[w.status] || '#9ca3af';
      html += '<tr><td><span style="display:inline-block; padding:2px 10px; border-radius:20px; font-size:14px; font-weight:700; background:' + typeBg + '; color:' + typeColor + ';">' + (w.type || '-') + '</span></td><td><strong>' + w.name + '</strong></td><td style="font-size:14px;">' + (w.role || '-') + '</td><td style="font-weight:700;">' + (w.contractAmount || 0).toLocaleString() + '원</td><td><span style="color:' + statusColor + '; font-weight:600; font-size:14px;">' + (w.status || '-') + '</span></td><td style="font-size:14px; color:var(--gray-500);">' + (w.memo || '-') + '</td><td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); deleteProjectWorker(\'' + proj.id + '\', ' + wi + ')" style="color:var(--red); font-size:14px;">삭제</button></td></tr>';
    });
    html += '</tbody></table></div>';
  }
  html += '</div>';
  // Revenue tab
  html += '<div id="proj-tab-' + proj.id + '-revenue" style="display:none;">' +
    '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">' +
      '<div style="background:var(--gray-50); padding:16px; border-radius:8px; text-align:center;"><div style="font-size:14px; color:var(--gray-500); font-weight:600;">예상 매출</div><div style="font-size:22px; font-weight:800; margin-top:8px;">' + (proj.expectedRevenue || 0).toLocaleString() + '원</div></div>' +
      '<div style="background:rgba(13,148,136,0.06); padding:16px; border-radius:8px; text-align:center;"><div style="font-size:14px; color:var(--gray-500); font-weight:600;">실제 매출</div><div style="font-size:22px; font-weight:800; margin-top:8px; color:var(--primary);">' + (proj.actualRevenue || 0).toLocaleString() + '원</div></div>' +
      '<div style="background:rgba(239,68,68,0.06); padding:16px; border-radius:8px; text-align:center;"><div style="font-size:14px; color:var(--gray-500); font-weight:600;">예상 인건비</div><div style="font-size:22px; font-weight:800; margin-top:8px; color:var(--red);">' + laborCost.toLocaleString() + '원</div></div>' +
    '</div>' +
    '<div style="margin-top:16px; background:var(--gray-50); padding:16px; border-radius:8px; text-align:center;"><div style="font-size:14px; color:var(--gray-500); font-weight:600;">예상 순이익 (실제매출 - 인건비)</div><div style="font-size:26px; font-weight:800; margin-top:8px; color:' + (((proj.actualRevenue || 0) - laborCost) >= 0 ? 'var(--primary)' : 'var(--red)') + ';">' + ((proj.actualRevenue || 0) - laborCost).toLocaleString() + '원</div></div>' +
  '</div>';
  // Costs tab
  html += '<div id="proj-tab-' + proj.id + '-costs" style="display:none;"><div><table><thead><tr><th>항목</th><th>내용</th><th>금액</th><th>삭제</th></tr></thead><tbody id="project-costs-' + proj.id + '"></tbody><tfoot><tr style="font-weight:700;"><td colspan="2">비용 합계</td><td id="project-cost-total-' + proj.id + '">\u20A90</td><td></td></tr><tr style="font-weight:700; color:var(--primary);"><td colspan="2">순익 (매출 - 비용 - 인건비)</td><td id="project-profit-' + proj.id + '">\u20A90</td><td></td></tr></tfoot></table>' +
    '<div style="margin-top:12px; display:flex; gap:8px;"><input type="text" id="cost-item-' + proj.id + '" placeholder="항목 (예: 제작비)" style="flex:1; padding:8px; border:1px solid var(--gray-200); border-radius:6px;"><input type="text" id="cost-desc-' + proj.id + '" placeholder="내용" style="flex:1; padding:8px; border:1px solid var(--gray-200); border-radius:6px;"><input type="number" id="cost-amount-' + proj.id + '" placeholder="금액" style="width:120px; padding:8px; border:1px solid var(--gray-200); border-radius:6px;"><button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); addProjectCost(\'' + proj.id + '\')">추가</button></div></div></div>';
  // Memo tab
  html += '<div id="proj-tab-' + proj.id + '-memo" style="display:none;"><div style="background:var(--gray-50); padding:16px; border-radius:8px; min-height:100px; white-space:pre-wrap; line-height:1.8; font-size:14px;">' + (proj.memo || '메모가 없습니다.') + '</div></div>';
  return html;
}

function toggleProjectChildren(parentId) {
  var el = document.getElementById('proj-children-' + parentId);
  var arrow = document.getElementById('proj-arrow-' + parentId);
  if (!el) return;
  if (el.style.display === 'none') {
    el.style.display = 'block';
    if (arrow) arrow.textContent = '\u25B2';
  } else {
    el.style.display = 'none';
    if (arrow) arrow.textContent = '\u25BC';
  }
}

function switchProjectTab(projId, tabName) {
  // Hide all tabs for this project
  const tabs = ['overview', 'workers', 'revenue', 'costs', 'memo'];
  tabs.forEach(t => {
    const tabEl = document.getElementById(`proj-tab-${projId}-${t}`);
    if (tabEl) tabEl.style.display = 'none';
    const btnEl = document.querySelector(`[data-proj-tab="${projId}-${t}"]`);
    if (btnEl) { btnEl.style.background = 'transparent'; btnEl.style.color = 'var(--gray-600)'; }
  });
  // Show selected tab
  const activeTab = document.getElementById(`proj-tab-${projId}-${tabName}`);
  if (activeTab) activeTab.style.display = 'block';
  const activeBtn = document.querySelector(`[data-proj-tab="${projId}-${tabName}"]`);
  if (activeBtn) { activeBtn.style.background = 'var(--primary)'; activeBtn.style.color = 'white'; }
  // Render costs when switching to costs tab
  if (tabName === 'costs') {
    renderProjectCosts(projId);
  }
}

function toggleProjectDetail(id) {
  const detail = document.getElementById('project-detail-' + id);
  if (!detail) return;
  detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
}

function openProjectModal(projectId, defaultParentId) {
  const titleEl = document.getElementById('project-modal-title');

  // Reset form
  document.getElementById('project-edit-id').value = '';
  document.getElementById('project-name').value = '';
  document.getElementById('project-ip').value = '';
  document.getElementById('project-status').value = 'preparing';
  // Reset team checkboxes
  document.querySelectorAll('.project-team-cb').forEach(cb => cb.checked = false);
  document.getElementById('project-operation-type').value = 'concert';
  if (document.getElementById('project-type-select')) document.getElementById('project-type-select').value = 'concert';
  if (document.getElementById('project-location')) document.getElementById('project-location').value = '';
  document.getElementById('project-start-date').value = '';
  document.getElementById('project-end-date').value = '';
  document.getElementById('project-required-staff').value = '';
  document.getElementById('project-assigned-staff').value = '';
  document.getElementById('project-budget-interior').value = '';
  document.getElementById('project-budget-production').value = '';
  document.getElementById('project-budget-giveaway').value = '';
  document.getElementById('project-budget-other').value = '';
  document.getElementById('project-product-memo').value = '';
  document.getElementById('project-target-revenue').value = '';
  document.getElementById('project-memo').value = '';
  calcProjectBudgetTotal();

  // Populate parent project dropdown
  const parentSelect = document.getElementById('project-parent');
  if (parentSelect) {
    const projects = JSON.parse(localStorage.getItem('bs_projects') || '[]');
    parentSelect.innerHTML = '<option value="">상위 프로젝트로 생성</option>' +
      projects.filter(function(p) { return !p.parentId; }).map(function(p) { return '<option value="' + p.id + '">' + p.name + '</option>'; }).join('');
    parentSelect.value = defaultParentId || '';
  }

  if (projectId) {
    titleEl.textContent = '프로젝트 수정';
    document.getElementById('project-edit-id').value = projectId;

    const projects = getProjectStore();
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      document.getElementById('project-name').value = proj.name || '';
      document.getElementById('project-ip').value = proj.ip || '';
      document.getElementById('project-status').value = proj.status || 'preparing';
      // Set team checkboxes
      const teamVal = proj.team || '';
      document.querySelectorAll('.project-team-cb').forEach(cb => {
        cb.checked = teamVal.includes(cb.value);
      });
      document.getElementById('project-operation-type').value = proj.operationType || 'concert';
      if (document.getElementById('project-type-select')) document.getElementById('project-type-select').value = proj.projectType || 'concert';
      if (document.getElementById('project-location')) document.getElementById('project-location').value = proj.location || '';
      if (parentSelect) parentSelect.value = proj.parentId || '';
      document.getElementById('project-start-date').value = proj.startDate || '';
      document.getElementById('project-end-date').value = proj.endDate || '';
      document.getElementById('project-required-staff').value = proj.requiredStaff || '';
      document.getElementById('project-assigned-staff').value = proj.assignedStaff || '';
      document.getElementById('project-budget-interior').value = proj.budgetInterior || '';
      document.getElementById('project-budget-production').value = proj.budgetProduction || '';
      document.getElementById('project-budget-giveaway').value = proj.budgetGiveaway || '';
      document.getElementById('project-budget-other').value = proj.budgetOther || '';
      document.getElementById('project-product-memo').value = proj.productMemo || '';
      document.getElementById('project-target-revenue').value = proj.targetRevenue || '';
      document.getElementById('project-memo').value = proj.memo || '';
      calcProjectBudgetTotal();
    }
  } else {
    titleEl.textContent = '프로젝트 생성';
  }

  openModal('project-modal');
}

function calcProjectBudgetTotal() {
  const interior = parseInt(document.getElementById('project-budget-interior').value) || 0;
  const production = parseInt(document.getElementById('project-budget-production').value) || 0;
  const giveaway = parseInt(document.getElementById('project-budget-giveaway').value) || 0;
  const other = parseInt(document.getElementById('project-budget-other').value) || 0;
  const total = interior + production + giveaway + other;
  const el = document.getElementById('project-budget-total');
  if (el) el.textContent = '₩' + total.toLocaleString();
}

function saveProject() {
  const editId = document.getElementById('project-edit-id').value;
  const name = document.getElementById('project-name').value.trim();
  const ip = document.getElementById('project-ip').value.trim();
  const status = document.getElementById('project-status').value;
  // Collect team checkboxes
  const teamArr = [];
  document.querySelectorAll('.project-team-cb:checked').forEach(cb => teamArr.push(cb.value));
  const team = teamArr.join(', ');
  const operationType = document.getElementById('project-operation-type').value;
  const parentId = document.getElementById('project-parent') ? document.getElementById('project-parent').value : '';
  const projectType = document.getElementById('project-type-select') ? document.getElementById('project-type-select').value : 'concert';
  const location = document.getElementById('project-location') ? document.getElementById('project-location').value.trim() : '';
  const startDate = document.getElementById('project-start-date').value;
  const endDate = document.getElementById('project-end-date').value;
  const requiredStaff = parseInt(document.getElementById('project-required-staff').value) || 0;
  const assignedStaff = document.getElementById('project-assigned-staff').value.trim();
  const budgetInterior = parseInt(document.getElementById('project-budget-interior').value) || 0;
  const budgetProduction = parseInt(document.getElementById('project-budget-production').value) || 0;
  const budgetGiveaway = parseInt(document.getElementById('project-budget-giveaway').value) || 0;
  const budgetOther = parseInt(document.getElementById('project-budget-other').value) || 0;
  const productMemo = document.getElementById('project-product-memo').value.trim();
  const targetRevenue = parseInt(document.getElementById('project-target-revenue').value) || 0;
  const memo = document.getElementById('project-memo').value.trim();

  if (!name) { showToast('프로젝트명을 입력해주세요.', 'error'); return; }
  if (!startDate || !endDate) { showToast('기간을 입력해주세요.', 'error'); return; }

  const projects = getProjectStore();

  if (editId) {
    // Edit existing
    const idx = projects.findIndex(p => p.id === editId);
    if (idx !== -1) {
      projects[idx].name = name;
      projects[idx].ip = ip;
      projects[idx].status = status;
      projects[idx].team = team;
      projects[idx].operationType = operationType;
      projects[idx].parentId = parentId;
      projects[idx].projectType = projectType;
      projects[idx].location = location;
      projects[idx].startDate = startDate;
      projects[idx].endDate = endDate;
      projects[idx].requiredStaff = requiredStaff;
      projects[idx].assignedStaff = assignedStaff;
      projects[idx].budgetInterior = budgetInterior;
      projects[idx].budgetProduction = budgetProduction;
      projects[idx].budgetGiveaway = budgetGiveaway;
      projects[idx].budgetOther = budgetOther;
      projects[idx].productMemo = productMemo;
      projects[idx].targetRevenue = targetRevenue;
      projects[idx].memo = memo;
    }
    showToast('프로젝트가 수정되었습니다.', 'success');
  } else {
    // Create new
    projects.push({
      id: 'proj_' + Date.now(),
      name: name,
      ip: ip,
      status: status,
      startDate: startDate,
      endDate: endDate,
      team: team,
      operationType: operationType,
      parentId: parentId,
      projectType: projectType,
      location: location,
      requiredStaff: requiredStaff,
      assignedStaff: assignedStaff,
      budgetInterior: budgetInterior,
      budgetProduction: budgetProduction,
      budgetGiveaway: budgetGiveaway,
      budgetOther: budgetOther,
      productMemo: productMemo,
      targetRevenue: targetRevenue,
      memo: memo,
      workers: [],
      costs: [],
      createdAt: new Date().toISOString().split('T')[0]
    });
    showToast('프로젝트가 생성되었습니다.', 'success');
  }

  setProjectStore(projects);
  closeModal('project-modal');
  loadProjects();
}

function deleteProject(id) {
  if (!confirm('이 프로젝트를 삭제하시겠습니까?')) return;
  const projects = getProjectStore();
  const filtered = projects.filter(p => p.id !== id);
  setProjectStore(filtered);
  showToast('프로젝트가 삭제되었습니다.', 'success');
  loadProjects();
}

function openWorkerModal(projectId) {
  document.getElementById('project-worker-project-id').value = projectId;
  document.getElementById('project-worker-type').value = '내부인력';
  document.getElementById('project-worker-name').value = '';
  document.getElementById('project-worker-role').value = '';
  document.getElementById('project-worker-phone').value = '';
  document.getElementById('project-worker-amount').value = '';
  document.getElementById('project-worker-status').value = '섭외중';
  document.getElementById('project-worker-memo').value = '';

  openModal('project-worker-modal');
}

function saveProjectWorker() {
  const projectId = document.getElementById('project-worker-project-id').value;
  const type = document.getElementById('project-worker-type').value;
  const name = document.getElementById('project-worker-name').value.trim();
  const role = document.getElementById('project-worker-role').value.trim();
  const phone = document.getElementById('project-worker-phone').value.trim();
  const contractAmount = parseInt(document.getElementById('project-worker-amount').value) || 0;
  const status = document.getElementById('project-worker-status').value;
  const memo = document.getElementById('project-worker-memo').value.trim();

  if (!name) { showToast('이름/회사명을 입력해주세요.', 'error'); return; }

  const projects = getProjectStore();
  const proj = projects.find(p => p.id === projectId);
  if (!proj) { showToast('프로젝트를 찾을 수 없습니다.', 'error'); return; }

  if (!proj.workers) proj.workers = [];
  proj.workers.push({
    id: 'w_' + Date.now(),
    type: type,
    name: name,
    role: role,
    phone: phone,
    contractAmount: contractAmount,
    status: status,
    memo: memo
  });

  setProjectStore(projects);
  closeModal('project-worker-modal');
  showToast(name + ' 인력이 배정되었습니다.', 'success');
  loadProjects();
}

function deleteProjectWorker(projectId, workerIndex) {
  if (!confirm('이 인력을 삭제하시겠습니까?')) return;
  const projects = getProjectStore();
  const proj = projects.find(p => p.id === projectId);
  if (!proj || !proj.workers) return;

  proj.workers.splice(workerIndex, 1);
  setProjectStore(projects);
  showToast('인력이 삭제되었습니다.', 'success');
  loadProjects();
}

function calculateProjectCost(project) {
  if (!project.workers || project.workers.length === 0) return 0;
  return project.workers.reduce((total, w) => {
    return total + (w.contractAmount || 0);
  }, 0);
}

// ============================================
// Accounts & Contacts (계정/연락처 관리)
// ============================================

function getAccountStore() {
  try {
    const data = JSON.parse(localStorage.getItem('bs_accounts') || 'null');
    if (data !== null) return data;
  } catch (e) {}

  // Default accounts (샘플)
  const defaults = [
    { name: '[샘플] 회사 공용 이메일', purpose: '업무용', username: 'sample@company.com', password: '(비밀번호 입력)', manager: '관리자' }
  ];
  localStorage.setItem('bs_accounts', JSON.stringify(defaults));
  return defaults;
}

function getContactStore() {
  try {
    const data = JSON.parse(localStorage.getItem('bs_contacts') || 'null');
    if (data !== null) return data;
  } catch (e) {}

  const defaults = [
    { name: '[샘플] 홍길동', nameEn: 'HONG GILDONG', position: 'CEO', team: '경영', email: 'sample@birchsound.com', phone: '010-0000-0000' }
  ];
  localStorage.setItem('bs_contacts', JSON.stringify(defaults));
  return defaults;
}

function getParttimeStore() {
  try {
    const data = JSON.parse(localStorage.getItem('bs_parttime_contacts') || 'null');
    if (data !== null) return data;
  } catch (e) {}

  const defaults = [
    { name: '[샘플] 김인턴', phone: '010-0000-0000', note: '샘플 데이터' },
    { name: '이지한', phone: '010-2622-7836', note: '1차' },
    { name: '이재경', phone: '010-7666-7502', note: '1차' }
  ];
  localStorage.setItem('bs_parttime_contacts', JSON.stringify(defaults));
  return defaults;
}

// ---- Accounts Tab Switching ----
function switchAccountsTab(tabName, btnEl) {
  const tabs = ['shared-accounts', 'emergency-contacts', 'parttime-contacts'];
  tabs.forEach(t => {
    const el = document.getElementById('accounts-tab-' + t);
    if (el) el.style.display = 'none';
  });
  document.querySelectorAll('.accounts-tab-btn').forEach(el => {
    el.style.background = 'transparent';
    el.style.color = 'var(--gray-600)';
  });
  const activeTab = document.getElementById('accounts-tab-' + tabName);
  if (activeTab) activeTab.style.display = 'block';
  if (btnEl) {
    btnEl.style.background = 'var(--primary)';
    btnEl.style.color = 'white';
  }
}

// ---- Accounts CRUD ----
function loadAccounts() {
  const accounts = getAccountStore();
  const tbody = document.getElementById('accounts-list');
  if (!tbody) return;

  if (accounts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">등록된 계정이 없습니다.</td></tr>';
    return;
  }

  tbody.innerHTML = accounts.map((acc, idx) => {
    const maskedPw = acc.password ? '\u2022'.repeat(Math.min(acc.password.length, 10)) : '-';
    return `<tr>
      <td><strong>${acc.name}</strong></td>
      <td style="font-size:14px; color:var(--gray-500);">${acc.purpose || '-'}</td>
      <td style="font-size:14px;">${acc.username || '-'}</td>
      <td style="font-size:14px;">
        <span id="pw-display-${idx}">${maskedPw}</span>
        <span id="pw-real-${idx}" style="display:none;">${acc.password || '-'}</span>
        ${acc.password ? `<button onclick="togglePassword(${idx})" style="background:none; border:none; cursor:pointer; padding:2px 6px; font-size:14px; color:var(--gray-400);" title="비밀번호 보기/숨기기" id="pw-toggle-${idx}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>` : ''}
      </td>
      <td style="font-size:14px; color:var(--gray-500);">${acc.manager || '-'}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="openAccountModal(${idx})" style="font-size:14px;">수정</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteAccount(${idx})" style="color:var(--red); font-size:14px;">삭제</button>
      </td>
    </tr>`;
  }).join('');
}

function togglePassword(idx) {
  const display = document.getElementById('pw-display-' + idx);
  const real = document.getElementById('pw-real-' + idx);
  if (!display || !real) return;

  if (real.style.display === 'none') {
    display.style.display = 'none';
    real.style.display = 'inline';
  } else {
    display.style.display = 'inline';
    real.style.display = 'none';
  }
}

function openAccountModal(editIdx) {
  const titleEl = document.getElementById('account-modal-title');
  document.getElementById('account-edit-index').value = '';
  document.getElementById('account-name').value = '';
  document.getElementById('account-purpose').value = '';
  document.getElementById('account-username').value = '';
  document.getElementById('account-password').value = '';
  document.getElementById('account-manager').value = '';

  if (editIdx !== undefined && editIdx !== null) {
    titleEl.textContent = '계정 수정';
    document.getElementById('account-edit-index').value = editIdx;
    const accounts = getAccountStore();
    const acc = accounts[editIdx];
    if (acc) {
      document.getElementById('account-name').value = acc.name || '';
      document.getElementById('account-purpose').value = acc.purpose || '';
      document.getElementById('account-username').value = acc.username || '';
      document.getElementById('account-password').value = acc.password || '';
      document.getElementById('account-manager').value = acc.manager || '';
    }
  } else {
    titleEl.textContent = '계정 추가';
  }
  openModal('account-modal');
}

function saveAccount() {
  const editIdx = document.getElementById('account-edit-index').value;
  const name = document.getElementById('account-name').value.trim();
  const purpose = document.getElementById('account-purpose').value.trim();
  const username = document.getElementById('account-username').value.trim();
  const password = document.getElementById('account-password').value.trim();
  const manager = document.getElementById('account-manager').value.trim();

  if (!name) { showToast('계정명을 입력해주세요.', 'error'); return; }

  const accounts = getAccountStore();

  if (editIdx !== '') {
    accounts[parseInt(editIdx)] = { name, purpose, username, password, manager };
    showToast('계정이 수정되었습니다.', 'success');
  } else {
    accounts.push({ name, purpose, username, password, manager });
    showToast('계정이 추가되었습니다.', 'success');
  }

  localStorage.setItem('bs_accounts', JSON.stringify(accounts));
  closeModal('account-modal');
  loadAccounts();
}

function deleteAccount(idx) {
  if (!confirm('이 계정을 삭제하시겠습니까?')) return;
  const accounts = getAccountStore();
  accounts.splice(idx, 1);
  localStorage.setItem('bs_accounts', JSON.stringify(accounts));
  showToast('계정이 삭제되었습니다.', 'success');
  loadAccounts();
}

// ---- Contacts CRUD ----
function loadContacts() {
  const contacts = getContactStore();
  const tbody = document.getElementById('contacts-list');
  if (!tbody) return;

  if (contacts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">등록된 연락처가 없습니다.</td></tr>';
    return;
  }

  tbody.innerHTML = contacts.map((c, idx) => {
    return `<tr>
      <td><strong>${c.name}</strong></td>
      <td style="font-size:14px;">${c.nameEn || '-'}</td>
      <td style="font-size:14px;">${c.position || '-'}</td>
      <td style="font-size:14px;">${c.team || '-'}</td>
      <td style="font-size:14px; color:var(--gray-500);">${c.email || '-'}</td>
      <td style="font-size:14px;">${c.phone || '-'}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="openContactModal(${idx})" style="font-size:14px;">수정</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteContact(${idx})" style="color:var(--red); font-size:14px;">삭제</button>
      </td>
    </tr>`;
  }).join('');
}

function openContactModal(editIdx) {
  const titleEl = document.getElementById('contact-modal-title');
  document.getElementById('contact-edit-index').value = '';
  document.getElementById('contact-name').value = '';
  document.getElementById('contact-name-en').value = '';
  document.getElementById('contact-position').value = '';
  document.getElementById('contact-team').value = '';
  document.getElementById('contact-email').value = '';
  document.getElementById('contact-phone').value = '';

  if (editIdx !== undefined && editIdx !== null) {
    titleEl.textContent = '연락처 수정';
    document.getElementById('contact-edit-index').value = editIdx;
    const contacts = getContactStore();
    const c = contacts[editIdx];
    if (c) {
      document.getElementById('contact-name').value = c.name || '';
      document.getElementById('contact-name-en').value = c.nameEn || '';
      document.getElementById('contact-position').value = c.position || '';
      document.getElementById('contact-team').value = c.team || '';
      document.getElementById('contact-email').value = c.email || '';
      document.getElementById('contact-phone').value = c.phone || '';
    }
  } else {
    titleEl.textContent = '연락처 추가';
  }
  openModal('contact-modal');
}

function saveContact() {
  const editIdx = document.getElementById('contact-edit-index').value;
  const name = document.getElementById('contact-name').value.trim();
  const nameEn = document.getElementById('contact-name-en').value.trim();
  const position = document.getElementById('contact-position').value.trim();
  const team = document.getElementById('contact-team').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const phone = document.getElementById('contact-phone').value.trim();

  if (!name) { showToast('이름을 입력해주세요.', 'error'); return; }

  const contacts = getContactStore();

  if (editIdx !== '') {
    contacts[parseInt(editIdx)] = { name, nameEn, position, team, email, phone };
    showToast('연락처가 수정되었습니다.', 'success');
  } else {
    contacts.push({ name, nameEn, position, team, email, phone });
    showToast('연락처가 추가되었습니다.', 'success');
  }

  localStorage.setItem('bs_contacts', JSON.stringify(contacts));
  closeModal('contact-modal');
  loadContacts();
}

function deleteContact(idx) {
  if (!confirm('이 연락처를 삭제하시겠습니까?')) return;
  const contacts = getContactStore();
  contacts.splice(idx, 1);
  localStorage.setItem('bs_contacts', JSON.stringify(contacts));
  showToast('연락처가 삭제되었습니다.', 'success');
  loadContacts();
}

// ---- Parttime Contacts CRUD ----
function loadParttimeContacts() {
  const contacts = getParttimeStore();
  const tbody = document.getElementById('parttime-contacts-list');
  if (!tbody) return;

  if (contacts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">등록된 연락처가 없습니다.</td></tr>';
    return;
  }

  tbody.innerHTML = contacts.map((c, idx) => {
    return `<tr>
      <td><strong>${c.name}</strong></td>
      <td style="font-size:14px;">${c.phone || '-'}</td>
      <td style="font-size:14px; color:var(--gray-500);">${c.note || '-'}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="openParttimeModal(${idx})" style="font-size:14px;">수정</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteParttimeContact(${idx})" style="color:var(--red); font-size:14px;">삭제</button>
      </td>
    </tr>`;
  }).join('');
}

function openParttimeModal(editIdx) {
  const titleEl = document.getElementById('parttime-modal-title');
  document.getElementById('parttime-edit-index').value = '';
  document.getElementById('parttime-name').value = '';
  document.getElementById('parttime-phone').value = '';
  document.getElementById('parttime-note').value = '';

  if (editIdx !== undefined && editIdx !== null) {
    titleEl.textContent = '파트타임 연락처 수정';
    document.getElementById('parttime-edit-index').value = editIdx;
    const contacts = getParttimeStore();
    const c = contacts[editIdx];
    if (c) {
      document.getElementById('parttime-name').value = c.name || '';
      document.getElementById('parttime-phone').value = c.phone || '';
      document.getElementById('parttime-note').value = c.note || '';
    }
  } else {
    titleEl.textContent = '파트타임 연락처 추가';
  }
  openModal('parttime-modal');
}

function saveParttimeContact() {
  const editIdx = document.getElementById('parttime-edit-index').value;
  const name = document.getElementById('parttime-name').value.trim();
  const phone = document.getElementById('parttime-phone').value.trim();
  const note = document.getElementById('parttime-note').value.trim();

  if (!name) { showToast('이름을 입력해주세요.', 'error'); return; }

  const contacts = getParttimeStore();

  if (editIdx !== '') {
    contacts[parseInt(editIdx)] = { name, phone, note };
    showToast('연락처가 수정되었습니다.', 'success');
  } else {
    contacts.push({ name, phone, note });
    showToast('연락처가 추가되었습니다.', 'success');
  }

  localStorage.setItem('bs_parttime_contacts', JSON.stringify(contacts));
  closeModal('parttime-modal');
  loadParttimeContacts();
}

function deleteParttimeContact(idx) {
  if (!confirm('이 연락처를 삭제하시겠습니까?')) return;
  const contacts = getParttimeStore();
  contacts.splice(idx, 1);
  localStorage.setItem('bs_parttime_contacts', JSON.stringify(contacts));
  showToast('연락처가 삭제되었습니다.', 'success');
  loadParttimeContacts();
}

// ============================================
// Calendar (전체 일정)
// ============================================

const calCategoryColors = {
  popup: '#9333EA',
  delivery: '#2563EB',
  event: '#16A34A',
  meeting: '#EAB308',
  deadline: '#DC2626',
  other: '#6B7280'
};

const calCategoryLabels = {
  popup: '공연',
  delivery: '리허설',
  event: '이벤트/프로모션',
  meeting: '회의',
  deadline: '마감/중요',
  other: '기타'
};

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-indexed
let calWeekDate = new Date(); // reference date for week view
let calCurrentView = 'month'; // 'year', 'month', 'week'

function getCalendarStore() {
  try {
    const data = JSON.parse(localStorage.getItem('bs_calendar') || 'null');
    if (data !== null) return data;
  } catch (e) {}

  // Pre-populate sample data
  const defaults = [
    {
      id: 'cal_001',
      title: '2026 Summer Music Festival',
      category: 'popup',
      startDate: '2026-07-15',
      endDate: '2026-07-17',
      time: '',
      location: '야외',
      manager: '',
      memo: '3일간 야외 페스티벌',
      color: '#9333EA',
      createdAt: '2026-03-25T00:00:00.000Z'
    },
    {
      id: 'cal_002',
      title: 'Artist Showcase Seoul',
      category: 'popup',
      startDate: '2026-09-01',
      endDate: '2026-09-01',
      time: '19:00',
      location: '공연장',
      manager: '',
      memo: '서울 공연',
      color: '#9333EA',
      createdAt: '2026-03-25T00:00:00.000Z'
    },
    {
      id: 'cal_003',
      title: '4월 정산 마감',
      category: 'deadline',
      startDate: '2026-04-10',
      endDate: '',
      time: '',
      location: '사무실',
      manager: '관리자',
      memo: '',
      color: '#DC2626',
      createdAt: '2026-03-25T00:00:00.000Z'
    },
    {
      id: 'cal_004',
      title: '아티스트 미팅',
      category: 'meeting',
      startDate: '2026-04-15',
      endDate: '',
      time: '14:00',
      location: '사무실',
      manager: '김한수',
      memo: '',
      color: '#EAB308',
      createdAt: '2026-03-25T00:00:00.000Z'
    }
  ];

  localStorage.setItem('bs_calendar', JSON.stringify(defaults));
  return defaults;
}

function setCalendarStore(data) {
  localStorage.setItem('bs_calendar', JSON.stringify(data));
}

function loadCalendar() {
  if (calCurrentView === 'year') {
    renderYearView(calYear);
    renderEventListForYear(calYear);
  } else if (calCurrentView === 'week') {
    renderWeekView(calWeekDate);
    renderEventListForWeek(calWeekDate);
  } else {
    renderCalendarGrid(calYear, calMonth);
    renderEventList(calYear, calMonth);
  }
}

function prevCalMonth() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  loadCalendar();
}

function nextCalMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  loadCalendar();
}

function getEventsForDate(dateStr) {
  const store = getCalendarStore();
  return store.filter(ev => {
    const end = ev.endDate || ev.startDate;
    return dateStr >= ev.startDate && dateStr <= end;
  });
}

function renderCalendarGrid(year, month) {
  const label = document.getElementById('cal-month-label');
  if (label) label.textContent = `${year}년 ${String(month + 1).padStart(2, '0')}월`;

  const tbody = document.getElementById('cal-grid-body');
  if (!tbody) return;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  let html = '';
  let dayCount = 1;
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    if (i % 7 === 0) html += '<tr>';

    if (i < firstDay || dayCount > daysInMonth) {
      html += '<td style="padding:8px; vertical-align:top; min-height:80px; height:100px; background:var(--gray-50);"></td>';
    } else {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayCount).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const dayOfWeek = new Date(year, month, dayCount).getDay();
      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;

      let cellStyle = 'padding:6px 8px; vertical-align:top; min-height:80px; height:100px; cursor:pointer; transition:background 0.15s;';
      if (isToday) cellStyle += ' border:2px solid var(--primary); background:rgba(13,148,136,0.04);';

      const events = getEventsForDate(dateStr);
      let badgesHtml = '';

      events.slice(0, 3).forEach(ev => {
        const color = ev.color || calCategoryColors[ev.category] || '#6B7280';
        const truncTitle = ev.title.length > 6 ? ev.title.substring(0, 6) + '..' : ev.title;
        badgesHtml += `<div onclick="event.stopPropagation(); openCalendarModal(null, '${ev.id}')" style="display:block; padding:1px 6px; border-radius:4px; font-size:13px; font-weight:600; background:${color}20; color:${color}; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; cursor:pointer;" title="${ev.title} | ${calCategoryLabels[ev.category] || ''} | ${ev.location || ''}">${truncTitle}</div>`;
      });

      if (events.length > 3) {
        badgesHtml += `<div style="font-size:13px; color:var(--gray-400); margin-top:2px; text-align:center;">+${events.length - 3}건</div>`;
      }

      const dateColor = isSunday ? 'var(--red)' : (isSaturday ? 'var(--blue)' : 'var(--gray-700)');

      html += `<td style="${cellStyle}" onclick="openCalendarModal('${dateStr}')">
        <div style="font-size:14px; font-weight:700; color:${dateColor}; margin-bottom:2px;">${dayCount}</div>
        <div style="line-height:1.3;">${badgesHtml}</div>
      </td>`;
      dayCount++;
    }

    if (i % 7 === 6) html += '</tr>';
  }

  tbody.innerHTML = html;
}

function renderEventList(year, month) {
  const store = getCalendarStore();
  const tbody = document.getElementById('cal-event-list');
  const countEl = document.getElementById('cal-event-count');
  if (!tbody) return;

  // Get events that overlap this month
  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const filtered = store.filter(ev => {
    const end = ev.endDate || ev.startDate;
    return ev.startDate <= monthEnd && end >= monthStart;
  }).sort((a, b) => a.startDate.localeCompare(b.startDate));

  if (countEl) countEl.textContent = filtered.length + '건';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">등록된 일정이 없습니다.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(ev => {
    const color = ev.color || calCategoryColors[ev.category] || '#6B7280';
    const catLabel = calCategoryLabels[ev.category] || ev.category;
    const dateDisplay = ev.endDate && ev.endDate !== ev.startDate
      ? ev.startDate + ' ~ ' + ev.endDate
      : ev.startDate;

    return `<tr>
      <td style="font-size:14px; white-space:nowrap;">${dateDisplay}</td>
      <td><span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:14px; font-weight:600; background:${color}20; color:${color};">${catLabel}</span></td>
      <td><strong>${ev.title}</strong></td>
      <td style="font-size:14px; color:var(--gray-500);">${ev.location || '-'}</td>
      <td style="font-size:14px; color:var(--gray-500);">${ev.time || '-'}</td>
      <td style="font-size:14px;">${ev.manager || '-'}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="openCalendarModal(null, '${ev.id}')" style="font-size:14px;">수정</button>
      </td>
    </tr>`;
  }).join('');
}

function openCalendarModal(dateStr, eventId) {
  const titleEl = document.getElementById('calendar-modal-title');
  const deleteBtn = document.getElementById('cal-delete-btn');

  // Reset form
  document.getElementById('cal-edit-id').value = '';
  document.getElementById('cal-title').value = '';
  document.getElementById('cal-category').value = 'popup';
  document.getElementById('cal-start-date').value = dateStr || '';
  document.getElementById('cal-end-date').value = '';
  document.getElementById('cal-time').value = '';
  document.getElementById('cal-location').value = '전체';
  document.getElementById('cal-manager').value = '';
  document.getElementById('cal-memo').value = '';
  deleteBtn.style.display = 'none';
  updateCalColor();

  if (eventId) {
    // Edit mode
    titleEl.textContent = '일정 수정';
    document.getElementById('cal-edit-id').value = eventId;
    deleteBtn.style.display = 'inline-flex';

    const store = getCalendarStore();
    const ev = store.find(e => e.id === eventId);
    if (ev) {
      document.getElementById('cal-title').value = ev.title || '';
      document.getElementById('cal-category').value = ev.category || 'popup';
      document.getElementById('cal-start-date').value = ev.startDate || '';
      document.getElementById('cal-end-date').value = ev.endDate || '';
      document.getElementById('cal-time').value = ev.time || '';
      document.getElementById('cal-location').value = ev.location || '전체';
      document.getElementById('cal-manager').value = ev.manager || '';
      document.getElementById('cal-memo').value = ev.memo || '';
      updateCalColor();
    }
  } else {
    titleEl.textContent = '일정 등록';
  }

  openModal('calendar-modal');
}

function updateCalColor() {
  const category = document.getElementById('cal-category').value;
  const color = calCategoryColors[category] || '#6B7280';
  const label = calCategoryLabels[category] || '기타';
  const preview = document.getElementById('cal-color-preview');
  const labelEl = document.getElementById('cal-color-label');
  if (preview) preview.style.background = color;
  if (labelEl) labelEl.textContent = label;
}

function saveCalendarEvent() {
  const editId = document.getElementById('cal-edit-id').value;
  const title = document.getElementById('cal-title').value.trim();
  const category = document.getElementById('cal-category').value;
  const startDate = document.getElementById('cal-start-date').value;
  const endDate = document.getElementById('cal-end-date').value;
  const time = document.getElementById('cal-time').value;
  const location = document.getElementById('cal-location').value;
  const manager = document.getElementById('cal-manager').value.trim();
  const memo = document.getElementById('cal-memo').value.trim();
  const color = calCategoryColors[category] || '#6B7280';

  if (!title) { showToast('제목을 입력해주세요.', 'error'); return; }
  if (!startDate) { showToast('시작일을 입력해주세요.', 'error'); return; }

  const store = getCalendarStore();

  if (editId) {
    const idx = store.findIndex(e => e.id === editId);
    if (idx !== -1) {
      store[idx].title = title;
      store[idx].category = category;
      store[idx].startDate = startDate;
      store[idx].endDate = endDate;
      store[idx].time = time;
      store[idx].location = location;
      store[idx].manager = manager;
      store[idx].memo = memo;
      store[idx].color = color;
    }
    showToast('일정이 수정되었습니다.', 'success');
  } else {
    store.push({
      id: 'cal_' + Date.now(),
      title,
      category,
      startDate,
      endDate,
      time,
      location,
      manager,
      memo,
      color,
      createdAt: new Date().toISOString()
    });
    showToast('일정이 등록되었습니다.', 'success');
  }

  setCalendarStore(store);
  closeModal('calendar-modal');
  loadCalendar();
}

function deleteCalendarEvent(id) {
  // If called from modal without id, get from hidden field
  if (!id) id = document.getElementById('cal-edit-id').value;
  if (!id) return;
  if (!confirm('이 일정을 삭제하시겠습니까?')) return;

  const store = getCalendarStore();
  const filtered = store.filter(e => e.id !== id);
  setCalendarStore(filtered);
  closeModal('calendar-modal');
  showToast('일정이 삭제되었습니다.', 'success');
  loadCalendar();
}

// ============================================
// Calendar View Switching & Year/Week Views
// ============================================

function switchCalView(view) {
  calCurrentView = view;

  // Toggle view containers
  const yearView = document.getElementById('cal-year-view');
  const monthView = document.getElementById('cal-month-view');
  const weekView = document.getElementById('cal-week-view');
  if (yearView) yearView.style.display = view === 'year' ? '' : 'none';
  if (monthView) monthView.style.display = view === 'month' ? '' : 'none';
  if (weekView) weekView.style.display = view === 'week' ? '' : 'none';

  // Toggle navigation
  const navYear = document.getElementById('cal-nav-year');
  const navMonth = document.getElementById('cal-nav-month');
  const navWeek = document.getElementById('cal-nav-week');
  if (navYear) navYear.style.display = view === 'year' ? 'flex' : 'none';
  if (navMonth) navMonth.style.display = view === 'month' ? 'flex' : 'none';
  if (navWeek) navWeek.style.display = view === 'week' ? 'flex' : 'none';

  // Update button styles
  const btnYear = document.getElementById('cal-view-year');
  const btnMonth = document.getElementById('cal-view-month');
  const btnWeek = document.getElementById('cal-view-week');
  [btnYear, btnMonth, btnWeek].forEach(btn => {
    if (btn) { btn.style.background = 'var(--gray-100)'; btn.style.color = 'var(--gray-600)'; }
  });
  const activeBtn = view === 'year' ? btnYear : (view === 'week' ? btnWeek : btnMonth);
  if (activeBtn) { activeBtn.style.background = 'var(--primary)'; activeBtn.style.color = 'white'; }

  // Update event list title
  const listTitle = document.getElementById('cal-event-list-title');
  if (listTitle) {
    if (view === 'year') listTitle.textContent = '연간 일정 리스트';
    else if (view === 'week') listTitle.textContent = '이번 주 일정 리스트';
    else listTitle.textContent = '이번 달 일정 리스트';
  }

  // Sync dates between views
  if (view === 'week') {
    calWeekDate = new Date(calYear, calMonth, new Date().getDate());
  }

  loadCalendar();
}

function prevCalYear() {
  calYear--;
  loadCalendar();
}

function nextCalYear() {
  calYear++;
  loadCalendar();
}

function prevCalWeek() {
  calWeekDate.setDate(calWeekDate.getDate() - 7);
  loadCalendar();
}

function nextCalWeek() {
  calWeekDate.setDate(calWeekDate.getDate() + 7);
  loadCalendar();
}

function getWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function renderYearView(year) {
  const label = document.getElementById('cal-year-label');
  if (label) label.textContent = `${year}년`;

  const container = document.getElementById('cal-year-grid');
  if (!container) return;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  let html = '<div style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px;">';

  for (let m = 0; m < 12; m++) {
    const firstDay = new Date(year, m, 1).getDay();
    const daysInMonth = new Date(year, m + 1, 0).getDate();

    html += `<div class="card" style="padding:12px;">`;
    html += `<div style="font-weight:700; text-align:center; margin-bottom:8px; cursor:pointer; color:var(--primary);" onclick="calYear=${year}; calMonth=${m}; switchCalView('month');">${m + 1}월</div>`;

    // Day name headers
    html += '<div style="display:grid; grid-template-columns:repeat(7,1fr); gap:1px; font-size:12px; text-align:center; margin-bottom:2px;">';
    dayNames.forEach((dn, di) => {
      const color = di === 0 ? 'var(--red)' : (di === 6 ? 'var(--blue)' : 'var(--gray-400)');
      html += `<div style="color:${color}; font-weight:600;">${dn}</div>`;
    });
    html += '</div>';

    // Day grid
    html += '<div style="display:grid; grid-template-columns:repeat(7,1fr); gap:1px; font-size:13px; text-align:center;">';

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      html += '<div style="padding:2px;"></div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const dayOfWeek = new Date(year, m, d).getDay();
      const events = getEventsForDate(dateStr);

      let cellStyle = 'padding:2px; cursor:pointer; border-radius:3px; position:relative;';
      if (isToday) cellStyle += ' background:var(--primary); color:white; font-weight:700;';
      else if (dayOfWeek === 0) cellStyle += ' color:var(--red);';
      else if (dayOfWeek === 6) cellStyle += ' color:var(--blue);';

      let dotHtml = '';
      if (events.length > 0) {
        const dotColor = events[0].color || '#6B7280';
        dotHtml = `<div style="position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:4px; height:4px; border-radius:50%; background:${dotColor};"></div>`;
      }

      html += `<div style="${cellStyle}" onclick="calYear=${year}; calMonth=${m}; switchCalView('month');" title="${events.length > 0 ? events.map(e => e.title).join(', ') : ''}">${d}${dotHtml}</div>`;
    }

    html += '</div></div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

function renderWeekView(date) {
  const monday = getWeekMonday(date);
  const container = document.getElementById('cal-week-grid');
  if (!container) return;

  // Update label
  const label = document.getElementById('cal-week-label');
  if (label) {
    const weekEnd = new Date(monday);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const mStart = monday.getMonth() + 1;
    const mEnd = weekEnd.getMonth() + 1;
    const weekNum = Math.ceil(monday.getDate() / 7);
    if (mStart === mEnd) {
      label.textContent = `${monday.getFullYear()}년 ${String(mStart).padStart(2, '0')}월 ${weekNum}주`;
    } else {
      label.textContent = `${monday.getFullYear()}년 ${String(mStart).padStart(2, '0')}월 ~ ${String(mEnd).padStart(2, '0')}월`;
    }
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

  let html = '<div style="display:grid; grid-template-columns:repeat(7,1fr); gap:8px;">';

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const dayOfWeek = d.getDay();
    const isWednesday = dayOfWeek === 3;

    const headerBg = isToday ? 'var(--primary)' : 'var(--gray-50)';
    const headerColor = isToday ? 'white' : (dayOfWeek === 0 ? 'var(--red)' : (dayOfWeek === 6 ? 'var(--blue)' : 'var(--gray-700)'));
    const borderStyle = isToday ? 'border:2px solid var(--primary);' : 'border:1px solid var(--gray-200);';

    html += `<div style="min-height:300px; ${borderStyle} border-radius:10px; overflow:hidden;">`;
    html += `<div style="text-align:center; padding:10px 8px; font-weight:700; background:${headerBg}; color:${headerColor};">`;
    html += `${d.getMonth() + 1}/${d.getDate()}<br><span style="font-size:14px; font-weight:500;">${dayNames[i]}</span>`;
    html += '</div>';

    html += '<div style="padding:6px;">';

    // Wednesday store closed banner
    if (isWednesday) {
      html += '<div style="padding:6px 8px; margin-bottom:6px; border-radius:6px; font-size:14px; font-weight:600; background:var(--gray-100); color:var(--gray-500); text-align:center;">정기 휴무</div>';
    }

    const events = getEventsForDate(dateStr);
    events.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    events.forEach(ev => {
      const color = ev.color || calCategoryColors[ev.category] || '#6B7280';
      const catLabel = calCategoryLabels[ev.category] || '';
      html += `<div onclick="openCalendarModal(null, '${ev.id}')" style="padding:6px 8px; margin-bottom:4px; border-radius:6px; font-size:14px; background:${color}15; border-left:3px solid ${color}; cursor:pointer;" title="${ev.title}">`;
      html += `<div style="font-weight:600; margin-bottom:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${ev.title}</div>`;
      if (ev.time) html += `<span style="font-size:13px; color:var(--gray-500);">${ev.time}</span> `;
      if (ev.location) html += `<span style="font-size:13px; color:var(--gray-400);">${ev.location}</span>`;
      if (catLabel) html += `<div style="font-size:12px; color:${color}; margin-top:2px;">${catLabel}</div>`;
      html += '</div>';
    });

    if (events.length === 0 && !isWednesday) {
      html += '<div style="font-size:14px; color:var(--gray-300); text-align:center; padding:20px 0;">일정 없음</div>';
    }

    html += '</div></div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

function renderEventListForYear(year) {
  const store = getCalendarStore();
  const tbody = document.getElementById('cal-event-list');
  const countEl = document.getElementById('cal-event-count');
  if (!tbody) return;

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const filtered = store.filter(ev => {
    const end = ev.endDate || ev.startDate;
    return ev.startDate <= yearEnd && end >= yearStart;
  }).sort((a, b) => a.startDate.localeCompare(b.startDate));

  if (countEl) countEl.textContent = filtered.length + '건';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">등록된 일정이 없습니다.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(ev => {
    const color = ev.color || calCategoryColors[ev.category] || '#6B7280';
    const catLabel = calCategoryLabels[ev.category] || ev.category;
    const dateDisplay = ev.endDate && ev.endDate !== ev.startDate
      ? ev.startDate + ' ~ ' + ev.endDate
      : ev.startDate;

    return `<tr>
      <td style="font-size:14px; white-space:nowrap;">${dateDisplay}</td>
      <td><span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:14px; font-weight:600; background:${color}20; color:${color};">${catLabel}</span></td>
      <td><strong>${ev.title}</strong></td>
      <td style="font-size:14px; color:var(--gray-500);">${ev.location || '-'}</td>
      <td style="font-size:14px; color:var(--gray-500);">${ev.time || '-'}</td>
      <td style="font-size:14px;">${ev.manager || '-'}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="openCalendarModal(null, '${ev.id}')" style="font-size:14px;">수정</button>
      </td>
    </tr>`;
  }).join('');
}

function renderEventListForWeek(date) {
  const monday = getWeekMonday(date);
  const store = getCalendarStore();
  const tbody = document.getElementById('cal-event-list');
  const countEl = document.getElementById('cal-event-count');
  if (!tbody) return;

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
  const weekEnd = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;

  const filtered = store.filter(ev => {
    const end = ev.endDate || ev.startDate;
    return ev.startDate <= weekEnd && end >= weekStart;
  }).sort((a, b) => a.startDate.localeCompare(b.startDate));

  if (countEl) countEl.textContent = filtered.length + '건';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">등록된 일정이 없습니다.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(ev => {
    const color = ev.color || calCategoryColors[ev.category] || '#6B7280';
    const catLabel = calCategoryLabels[ev.category] || ev.category;
    const dateDisplay = ev.endDate && ev.endDate !== ev.startDate
      ? ev.startDate + ' ~ ' + ev.endDate
      : ev.startDate;

    return `<tr>
      <td style="font-size:14px; white-space:nowrap;">${dateDisplay}</td>
      <td><span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:14px; font-weight:600; background:${color}20; color:${color};">${catLabel}</span></td>
      <td><strong>${ev.title}</strong></td>
      <td style="font-size:14px; color:var(--gray-500);">${ev.location || '-'}</td>
      <td style="font-size:14px; color:var(--gray-500);">${ev.time || '-'}</td>
      <td style="font-size:14px;">${ev.manager || '-'}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="openCalendarModal(null, '${ev.id}')" style="font-size:14px;">수정</button>
      </td>
    </tr>`;
  }).join('');
}

// ============================================
// Mobile Menu
// ============================================

function toggleMobileMenu() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const btn = document.getElementById('mobile-menu-btn');
  if (!sidebar || !overlay) return;
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
  if (btn) btn.textContent = sidebar.classList.contains('open') ? '\u2715' : '\u2630';
}

// Auto-close sidebar on nav click (mobile)
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        var sidebar = document.querySelector('.sidebar');
        var overlay = document.getElementById('sidebar-overlay');
        var btn = document.getElementById('mobile-menu-btn');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        if (btn) btn.textContent = '\u2630';
      }
    });
  });
});

// ============================================
// Messages (메시지)
// ============================================

async function loadMessages() {
  var user = await getCurrentUser();
  var listEl = document.getElementById('message-list');
  if (!listEl) return;

  var myId = user ? user.id : '';

  // Supabase에서 메시지 로드 (전체 + 내가 보낸/받은)
  var { data: messages, error } = await sb
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !messages) messages = [];

  if (messages.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><p>메시지가 없습니다.</p></div>';
    return;
  }

  listEl.innerHTML = messages.map(function(msg) {
    var isMine = (msg.from_id === myId);
    var isAll = msg.is_broadcast;
    var timeStr = new Date(msg.created_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    var toLabel = isAll ? '<span style="display:inline-block; padding:1px 6px; border-radius:4px; font-size:14px; font-weight:600; background:var(--blue-bg); color:var(--blue);">전체</span>' : (msg.to_name || '');

    var align = isMine ? 'flex-end' : 'flex-start';
    var bubbleClass = isMine ? 'mine' : (isAll ? 'broadcast' : 'others');

    return '<div style="display:flex; flex-direction:column; align-items:' + align + '; margin-bottom:16px;">' +
      '<div style="font-size:14px; color:var(--gray-400); margin-bottom:4px;">' +
        '<strong style="color:var(--gray-700);">' + (msg.from_name || '') + '</strong>' +
        ' &rarr; ' + toLabel +
        ' &middot; ' + timeStr +
      '</div>' +
      '<div class="message-bubble ' + bubbleClass + '">' + (msg.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</div>' +
    '</div>';
  }).join('');
}

async function openMessageModal() {
  var toSelect = document.getElementById('message-to');
  if (!toSelect) return;

  // Populate recipients from profiles
  try {
    var result = await getSB().from('profiles').select('id, name, department').order('name');
    var members = result.data;
    if (members && members.length > 0) {
      toSelect.innerHTML = '<option value="all">전체</option>' +
        members.map(function(m) {
          return '<option value="' + m.id + '" data-name="' + m.name + '">' + m.name + ' (' + (m.department || '미지정') + ')</option>';
        }).join('');
    }
  } catch (e) {
    // If Supabase fails, use contacts from localStorage as fallback
    var contacts = getContactStore();
    toSelect.innerHTML = '<option value="all">전체</option>' +
      contacts.map(function(c) {
        return '<option value="local_' + c.name + '" data-name="' + c.name + '">' + c.name + '</option>';
      }).join('');
  }

  document.getElementById('message-content').value = '';
  openModal('message-modal');
}

async function sendMessage() {
  var toSelect = document.getElementById('message-to');
  var content = document.getElementById('message-content').value.trim();

  if (!content) {
    showToast('메시지 내용을 입력해주세요.', 'error');
    return;
  }

  var user = await getCurrentUser();
  var fromId = user ? user.id : 'unknown';
  var fromName = (user && user.profile) ? user.profile.name : '나';

  var toValue = toSelect.value;
  var selectedOption = toSelect.options[toSelect.selectedIndex];
  var toName = toValue === 'all' ? '전체' : (selectedOption.getAttribute('data-name') || toValue);

  var isBroadcast = (toValue === 'all');
  var { error } = await getSB().from('messages').insert({
    from_id: fromId,
    from_name: fromName,
    to_id: isBroadcast ? null : toValue,
    to_name: toName,
    content: content,
    is_broadcast: isBroadcast
  });

  if (error) {
    showToast('메시지 전송 실패: ' + error.message, 'error');
    return;
  }

  closeModal('message-modal');
  showToast('메시지가 전송되었습니다.', 'success');
  loadMessages();
}

// Inventory & Closing - removed (not applicable for entertainment company)
// Stub functions to prevent errors
function loadInventory() {}
function switchInventoryTab() {}
function renderInventoryStock() {}
function getInventoryStore() { return []; }
function getReceivingStore() { return []; }
function getOrderStore() { return []; }
function loadClosing() {}
function calcClosingTotal() {}
function submitClosing() {}
function renderClosingHistory() {}
function downloadClosingExcel() {}
function getClosingHistory() { return []; }
function handleInventoryUpload() {}
function downloadInventoryExcel() {}
function filterInventory() {}
function showMoreInventory() {}
function saveInventoryItem() {}
function editInventoryItem() {}
function deleteInventoryItem() {}
function saveReceiving() {}
function deleteReceiving() {}
function saveOrder() {}
function updateOrderStatus() {}
function deleteOrder() {}
function checkLowStock() {}
function renderPublisherSummary() {}
function renderReceiving() {}
function renderOrders() {}
// ===== IP Management =====
let currentIPTab = 'artist';
function loadIP() { renderIPTable(); }
function switchIPTab(tab) {
  currentIPTab = tab;
  document.querySelectorAll('[id^="ip-tab-"]').forEach(b => b.className = 'btn btn-sm btn-secondary');
  const active = document.getElementById('ip-tab-' + tab);
  if (active) active.className = 'btn btn-sm btn-primary';
  if (tab === 'portfolio') { renderIPPortfolio(); return; }
  renderIPTable();
}
function renderIPPortfolio() {
  const artists = getIPStore().filter(i => i.type === 'artist');
  const shows = getIPStore().filter(i => i.type === 'show');
  const contents = getIPStore().filter(i => i.type === 'content');
  const tbody = document.getElementById('ip-table-body');
  const headerRow = document.getElementById('ip-table-header');
  if (!tbody) return;
  if (headerRow) headerRow.innerHTML = '<th colspan="6">아티스트 포트폴리오</th>';
  if (artists.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state">아티스트를 먼저 등록하세요.</td></tr>'; return; }
  tbody.innerHTML = artists.map(a => {
    const showCount = shows.filter(s => (s.agency || '').includes(a.name) || (s.name || '').includes(a.name)).length;
    const contentCount = contents.filter(c => (c.agency || '').includes(a.name) || (c.name || '').includes(a.name)).length;
    return '<tr><td colspan="6" style="padding:0;"><div style="padding:16px; display:flex; gap:16px; align-items:center; cursor:pointer;">' +
      '<div style="width:60px; height:60px; background:var(--gray-200); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:24px;">&#127908;</div>' +
      '<div style="flex:1;"><div style="font-weight:700;">' + (a.name || '') + '</div>' +
      '<div style="font-size:14px; color:var(--gray-500);">' + (a.genre || '-') + ' | ' + (a.agency || '-') + '</div>' +
      '<div style="font-size:14px; color:var(--gray-400); margin-top:4px;">공연 ' + showCount + '회 | 콘텐츠 ' + contentCount + '개</div></div></div></td></tr>';
  }).join('');
}
function getIPStore() {
  const d = localStorage.getItem('bs_ip_data');
  if (d) return JSON.parse(d);
  const defaults = [
    { id: 'ip1', type: 'artist', name: '[샘플] BTS', genre: 'K-Pop', agency: 'HYBE', status: 'confirmed', nextEvent: '2026 Summer Festival', contact: 'booking@hybe.com', memo: '헤드라이너 후보', fee: '500000000' },
    { id: 'ip2', type: 'artist', name: '[샘플] Dua Lipa', genre: 'Pop', agency: 'TAP Music', status: 'negotiating', nextEvent: '', contact: 'agent@tapmusic.com', memo: '출연료 협상 중', fee: '800000000' },
    { id: 'ip3', type: 'artist', name: '[샘플] BLACKPINK', genre: 'K-Pop', agency: 'YG Entertainment', status: 'contacting', nextEvent: '', contact: '', memo: '에이전시 컨택 예정', fee: '' },
    { id: 'ip4', type: 'show', name: '[샘플] 2026 Summer Music Festival', genre: 'Festival', agency: '', status: 'confirmed', nextEvent: '2026-07-15 ~ 07-17', contact: '', memo: '메인 페스티벌' },
    { id: 'ip5', type: 'content', name: '[샘플] Festival Documentary', genre: '영상', agency: '제작사 미정', status: 'candidate', nextEvent: '', contact: '', memo: '다큐멘터리 기획 중' }
  ];
  localStorage.setItem('bs_ip_data', JSON.stringify(defaults));
  return defaults;
}
const IP_STATUS = {
  candidate: { label: '후보', cls: 'badge-rejected', color: '#DC2626' },
  contacting: { label: '컨택 예정', cls: 'badge-pending', color: '#B8860B' },
  contacted: { label: '컨택 중', cls: 'badge-pending', color: '#EA580C' },
  negotiating: { label: '협상 중', cls: 'badge-pending', color: '#2563EB' },
  confirmed: { label: '확정', cls: 'badge-approved', color: '#16A34A' },
  rejected: { label: '거절/보류', cls: 'badge-rejected', color: '#6B7280' }
};
function renderIPTable() {
  const items = getIPStore().filter(i => i.type === currentIPTab);
  const tbody = document.getElementById('ip-table-body');
  if (!tbody) return;
  const headers = { artist: ['아티스트','장르','에이전시','섭외 상태','예상 출연료','연락처'], show: ['공연명','장르','기간','장소','상태','메모'], content: ['콘텐츠명','유형','상태','담당','메모',''], portfolio: ['아티스트','장르','에이전시','공연','콘텐츠',''] };
  const headerRow = document.getElementById('ip-table-header');
  if (headerRow) headerRow.innerHTML = (headers[currentIPTab] || headers.artist).map(h => '<th>' + h + '</th>').join('');
  if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state">데이터가 없습니다. + IP 등록 버튼으로 추가하세요.</td></tr>'; return; }
  tbody.innerHTML = items.map((item, i) => {
    const st = IP_STATUS[item.status] || IP_STATUS.candidate;
    const feeStr = item.fee ? '₩' + parseInt(item.fee).toLocaleString() : '-';
    return '<tr style="cursor:pointer;" onclick="editIP(' + i + ')">' +
    '<td style="font-weight:600;">' + (item.name || '') + '</td>' +
    '<td>' + (item.genre || '') + '</td>' +
    '<td>' + (item.agency || '-') + '</td>' +
    '<td><span class="badge" style="background:' + st.color + '20; color:' + st.color + ';">' + st.label + '</span></td>' +
    (currentIPTab === 'artist' ? '<td>' + feeStr + '</td>' : '<td>' + (item.nextEvent || '-') + '</td>') +
    '<td>' + (item.contact || '-') + '</td></tr>';
  }).join('');
}
function openIPModal() {
  closeModal('ip-modal');
  var projSelect = document.getElementById('ip-project-link');
  if (projSelect) {
    var projects = JSON.parse(localStorage.getItem('bs_projects') || '[]');
    projSelect.innerHTML = '<option value="">없음</option>' + projects.map(function(p) { return '<option value="' + p.id + '">' + p.name + (p.location ? ' (' + p.location + ')' : '') + '</option>'; }).join('');
  }
  document.getElementById('ip-modal').classList.add('active');
}
function editIP(idx) { openIPModal(); /* TODO: fill form */ }
function saveIP() {
  const item = { id: 'ip_' + Date.now(), type: document.getElementById('ip-type')?.value || 'artist', name: document.getElementById('ip-name')?.value || '', genre: document.getElementById('ip-genre')?.value || '', agency: document.getElementById('ip-agency')?.value || '', status: document.getElementById('ip-status')?.value || 'candidate', nextEvent: document.getElementById('ip-next-event')?.value || '', contact: document.getElementById('ip-contact')?.value || '', fee: document.getElementById('ip-fee')?.value || '', memo: document.getElementById('ip-memo')?.value || '', linkedProject: document.getElementById('ip-project-link')?.value || '' };
  if (!item.name) { showToast('이름을 입력하세요', 'error'); return; }
  const store = getIPStore(); store.push(item); localStorage.setItem('bs_ip_data', JSON.stringify(store));
  closeModal('ip-modal'); renderIPTable(); showToast('IP 등록 완료', 'success');
}

// ===== Contract Management =====
let currentContractTab = 'all';
const CONTRACT_TYPES = { artist: '아티스트', venue: '대관', ad: '광고', show: '공연', overseas: '해외', copyright: '저작권', collab: '콜라보' };
function loadContracts() { renderContractTable(); }
function switchContractTab(tab) {
  currentContractTab = tab;
  document.querySelectorAll('[id^="ct-tab-"]').forEach(b => b.className = 'btn btn-sm btn-secondary');
  const active = document.getElementById('ct-tab-' + tab);
  if (active) active.className = 'btn btn-sm btn-primary';
  renderContractTable();
}
function getContractStore() {
  const d = localStorage.getItem('bs_contracts');
  if (d) return JSON.parse(d);
  const defaults = [];
  localStorage.setItem('bs_contracts', JSON.stringify(defaults));
  return defaults;
}
function renderContractTable() {
  const all = getContractStore();
  const items = currentContractTab === 'all' ? all : all.filter(c => c.type === currentContractTab);
  const tbody = document.getElementById('contract-table-body');
  if (!tbody) return;
  const el = id => document.getElementById(id);
  if (el('contract-total')) el('contract-total').textContent = all.length;
  if (el('contract-active')) el('contract-active').textContent = all.filter(c => c.status === 'signed').length;
  if (el('contract-expiring')) el('contract-expiring').textContent = all.filter(c => c.status === 'expiring').length;
  if (el('contract-nego')) el('contract-nego').textContent = all.filter(c => c.status === 'negotiating').length;
  if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">계약을 등록하세요.</td></tr>'; return; }
  tbody.innerHTML = items.map(c => {
    const statusMap = { negotiating: ['협상중','badge-pending'], signed: ['체결','badge-approved'], expiring: ['만료 예정','badge-pending'], expired: ['만료','badge-rejected'] };
    const [label, cls] = statusMap[c.status] || ['기타','badge-pending'];
    return '<tr><td style="font-weight:600;">' + c.name + '</td><td>' + (CONTRACT_TYPES[c.type] || c.type) + '</td><td>' + (c.party || '-') + '</td><td style="font-size:14px;">' + (c.startDate || '') + ' ~ ' + (c.endDate || '') + '</td><td>' + (c.revenueShare ? c.revenueShare + '%' : '-') + '</td><td>' + (c.mg ? '₩' + parseInt(c.mg).toLocaleString() : '-') + '</td><td><span class="badge ' + cls + '">' + label + '</span></td></tr>';
  }).join('');
}
function openContractModal() {
  closeModal('contract-modal');
  var projSelect = document.getElementById('contract-project-link');
  if (projSelect) {
    var projects = JSON.parse(localStorage.getItem('bs_projects') || '[]');
    projSelect.innerHTML = '<option value="">없음</option>' + projects.map(function(p) { return '<option value="' + p.id + '">' + p.name + (p.location ? ' (' + p.location + ')' : '') + '</option>'; }).join('');
  }
  document.getElementById('contract-modal').classList.add('active');
}
function saveContract() {
  const item = { id: 'ct_' + Date.now(), name: document.getElementById('contract-name')?.value || '', type: document.getElementById('contract-type')?.value || 'artist', party: document.getElementById('contract-party')?.value || '', startDate: document.getElementById('contract-start')?.value || '', endDate: document.getElementById('contract-end')?.value || '', revenueShare: document.getElementById('contract-revenue-share')?.value || '', mg: document.getElementById('contract-mg')?.value || '', royalty: document.getElementById('contract-royalty')?.value || '', status: document.getElementById('contract-status')?.value || 'negotiating', memo: document.getElementById('contract-memo')?.value || '', linkedProject: document.getElementById('contract-project-link')?.value || '' };
  if (!item.name) { showToast('계약명을 입력하세요', 'error'); return; }
  const store = getContractStore(); store.push(item); localStorage.setItem('bs_contracts', JSON.stringify(store));
  closeModal('contract-modal'); renderContractTable(); showToast('계약 등록 완료', 'success');
}

// ===== Finance =====
let currentFinanceTab = 'revenue';
function loadFinance() { renderFinanceTable(); }
function switchFinanceTab(tab) {
  currentFinanceTab = tab;
  document.querySelectorAll('[id^="fin-tab-"]').forEach(b => b.className = 'btn btn-sm btn-secondary');
  const active = document.getElementById('fin-tab-' + tab);
  if (active) active.className = 'btn btn-sm btn-primary';
  renderFinanceTable();
}
function getFinanceStore() {
  const d = localStorage.getItem('bs_finance');
  return d ? JSON.parse(d) : [];
}
function renderFinanceTable() {
  const all = getFinanceStore();
  const items = currentFinanceTab === 'revenue' ? all.filter(f => f.type === 'revenue' || f.type === 'purchase') : currentFinanceTab === 'expense' ? all.filter(f => f.type === 'expense') : all;
  const tbody = document.getElementById('finance-table-body');
  if (!tbody) return;
  if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state">거래 데이터를 등록하세요.</td></tr>'; return; }
  tbody.innerHTML = items.map(f => '<tr><td>' + (f.date || '-') + '</td><td><span class="badge ' + (f.type === 'revenue' ? 'badge-approved' : f.type === 'purchase' ? 'badge-pending' : 'badge-rejected') + '">' + (f.type === 'revenue' ? '매출' : f.type === 'purchase' ? '매입' : '비용') + '</span></td><td>' + (f.item || '-') + '</td><td style="font-weight:700; color:' + (f.type === 'revenue' ? 'var(--green)' : 'var(--red)') + ';">₩' + (parseInt(f.amount) || 0).toLocaleString() + '</td><td>' + (f.project || '-') + '</td><td style="font-size:14px;">' + (f.note || '-') + '</td></tr>').join('');
}
function openFinanceModal() { closeModal('finance-modal'); document.getElementById('finance-modal').classList.add('active'); }
function saveFinance() {
  const item = { id: 'fin_' + Date.now(), type: document.getElementById('finance-type')?.value || 'revenue', date: document.getElementById('finance-date')?.value || new Date().toISOString().split('T')[0], item: document.getElementById('finance-item')?.value || '', amount: document.getElementById('finance-amount')?.value || 0, project: document.getElementById('finance-project')?.value || '', note: document.getElementById('finance-note')?.value || '' };
  if (!item.item) { showToast('항목을 입력하세요', 'error'); return; }
  const store = getFinanceStore(); store.push(item); localStorage.setItem('bs_finance', JSON.stringify(store));
  closeModal('finance-modal'); renderFinanceTable(); showToast('거래 등록 완료', 'success');
}

// ============================================
// Settings (설정)
// ============================================

function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('bs_settings') || '{}');
  const features = ['attendance', 'approval', 'messages', 'ip', 'contract', 'settlement'];
  features.forEach(f => {
    const el = document.getElementById('setting-' + f);
    if (el) el.checked = settings[f] !== false; // default true
  });
  loadPermissionTable();
  loadApproverSettings();
}

function getApproverSettings() {
  try { return JSON.parse(localStorage.getItem('bs_approvers') || 'null'); } catch(e) {}
  return null;
}

function loadApproverSettings() {
  const tbody = document.getElementById('approver-table');
  if (!tbody) return;
  const depts = ['경영','기획','제작','아티스트','마케팅','디자인','기술','기타'];
  let settings = getApproverSettings();
  if (!settings) {
    settings = depts.map(d => ({ dept: d, approver1: '', approver2: '' }));
  }
  tbody.innerHTML = settings.map((s, i) => {
    return `<tr>
      <td style="font-weight:600;">${s.dept}</td>
      <td><input type="text" id="approver1-${i}" value="${s.approver1 || ''}" placeholder="이름 입력" style="padding:8px; border:1px solid var(--gray-200); border-radius:6px; font-family:inherit; font-size:14px; width:100%;"></td>
      <td><input type="text" id="approver2-${i}" value="${s.approver2 || ''}" placeholder="(선택사항)" style="padding:8px; border:1px solid var(--gray-200); border-radius:6px; font-family:inherit; font-size:14px; width:100%;"></td>
    </tr>`;
  }).join('');
}

function saveApproverSettings() {
  const tbody = document.getElementById('approver-table');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  const settings = [];
  rows.forEach((row, i) => {
    const dept = row.querySelector('td')?.textContent || '';
    const a1 = document.getElementById('approver1-' + i)?.value || '';
    const a2 = document.getElementById('approver2-' + i)?.value || '';
    settings.push({ dept, approver1: a1, approver2: a2 });
  });
  localStorage.setItem('bs_approvers', JSON.stringify(settings));
  showToast('결재자 설정이 저장되었습니다.', 'success');
}

function addApproverRow() {
  const dept = prompt('추가할 부서명을 입력하세요:');
  if (!dept) return;
  let settings = getApproverSettings() || [];
  settings.push({ dept, approver1: '', approver2: '' });
  localStorage.setItem('bs_approvers', JSON.stringify(settings));
  loadApproverSettings();
}

async function loadPermissionTable() {
  const tbody = document.getElementById('permission-table');
  if (!tbody) return;

  try {
    const { data: profiles } = await getSB().from('profiles').select('*').order('name');
    if (!profiles || profiles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">등록된 직원이 없습니다.</td></tr>';
      return;
    }

    const roleLabels = { ceo: '대표', admin: '관리자', manager: '팀장', member: '팀원', guest: '게스트' };
    const roleColors = { ceo: 'var(--primary)', admin: 'var(--blue)', manager: 'var(--green)', member: 'var(--gray-600)', guest: 'var(--gray-400)' };

    tbody.innerHTML = profiles.map(p => `<tr>
      <td style="font-weight:600;">${p.name || '-'}${p.id === (currentUser && currentUser.id) ? ' (나)' : ''}</td>
      <td style="font-size:14px;">${p.email || '-'}</td>
      <td>${p.department || '-'}</td>
      <td><span style="color:${roleColors[p.role] || 'inherit'}; font-weight:600;">${roleLabels[p.role] || p.role}</span></td>
      <td>
        <select onchange="changeUserRole('${p.id}', this.value)" style="padding:6px 10px; border:1px solid var(--gray-200); border-radius:6px; font-family:inherit; font-size:14px;" ${p.id === (currentUser && currentUser.id) ? 'disabled title="본인 권한은 변경할 수 없습니다"' : ''}>
          <option value="ceo" ${p.role === 'ceo' ? 'selected' : ''}>대표</option>
          <option value="admin" ${p.role === 'admin' ? 'selected' : ''}>관리자</option>
          <option value="manager" ${p.role === 'manager' ? 'selected' : ''}>팀장</option>
          <option value="member" ${p.role === 'member' ? 'selected' : ''}>팀원</option>
          <option value="guest" ${p.role === 'guest' ? 'selected' : ''}>게스트</option>
        </select>
      </td>
    </tr>`).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">데이터를 불러올 수 없습니다.</td></tr>';
  }
}

async function changeUserRole(userId, newRole) {
  try {
    const { error } = await getSB().from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) throw error;
    showToast('권한이 변경되었습니다.', 'success');
    loadPermissionTable();
  } catch (e) {
    showToast('권한 변경 실패: ' + e.message, 'error');
  }
}

function saveSettings() {
  const settings = {};
  const features = ['attendance', 'approval', 'messages', 'ip', 'contract', 'settlement'];
  features.forEach(f => {
    const el = document.getElementById('setting-' + f);
    if (el) settings[f] = el.checked;
  });
  localStorage.setItem('bs_settings', JSON.stringify(settings));
  applySettings();
  showToast('설정이 저장되었습니다.', 'success');
}

// 설정 → 사이드바 매핑 (하나의 설정이 여러 메뉴를 제어)
const SETTING_PAGE_MAP = {
  attendance: ['attendance'],
  approval: ['approval'],
  messages: ['messages'],
  ip: ['ip'],
  contract: ['contract'],
  settlement: ['concert-settle', 'overseas-settle', 'settlement']
};

function applySettings() {
  const settings = JSON.parse(localStorage.getItem('bs_settings') || '{}');
  Object.entries(SETTING_PAGE_MAP).forEach(([key, pages]) => {
    const hidden = settings[key] === false;
    pages.forEach(page => {
      const navItem = document.querySelector('[data-page="' + page + '"]');
      if (navItem) navItem.style.display = hidden ? 'none' : '';
    });
  });
  // FINANCE 섹션 전체 숨기기 (정산 끄면)
  if (settings.settlement === false) {
    document.querySelectorAll('.nav-section').forEach(sec => {
      const title = sec.querySelector('.nav-section-title');
      if (title && title.textContent.trim() === 'FINANCE') sec.style.display = 'none';
    });
  } else {
    document.querySelectorAll('.nav-section').forEach(sec => {
      const title = sec.querySelector('.nav-section-title');
      if (title && title.textContent.trim() === 'FINANCE') sec.style.display = '';
    });
  }
}

function openPasswordModal() {
  const newPw = prompt('새 비밀번호를 입력하세요 (6자 이상):');
  if (!newPw || newPw.length < 6) { showToast('비밀번호는 6자 이상이어야 합니다.', 'error'); return; }
  getSB().auth.updateUser({ password: newPw }).then(({ error }) => {
    if (error) showToast('변경 실패: ' + error.message, 'error');
    else showToast('비밀번호가 변경되었습니다.', 'success');
  });
}

function deleteAccount() {
  if (!confirm('정말 계정을 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
  if (!confirm('마지막 확인: 모든 데이터가 삭제됩니다. 계속하시겠습니까?')) return;
  showToast('관리자에게 탈퇴를 요청해주세요.', 'info');
}

// ============================================
// CONCERT SETTLEMENT (공연 정산)
// ============================================
function getConcertSettleStore() {
  const d = localStorage.getItem('bs_concert_settle');
  return d ? JSON.parse(d) : [];
}
function loadConcertSettle() { renderConcertSettle(); }
function renderConcertSettle() {
  const items = getConcertSettleStore();
  const tbody = document.getElementById('concert-settle-table');
  if (!tbody) return;
  if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">공연 정산을 등록하세요.</td></tr>'; return; }
  tbody.innerHTML = items.map(item => {
    const statusMap = { draft: ['초안','badge-pending'], confirmed: ['확정','badge-approved'], paid: ['지급완료','badge-approved'] };
    const [label, cls] = statusMap[item.status] || ['초안','badge-pending'];
    return '<tr><td style="font-weight:600;">' + (item.name || '-') + '</td><td>' + (item.date || '-') + '</td><td style="font-weight:700; color:var(--primary);">' + fmtWon(item.totalRevenue) + '</td><td style="color:var(--red);">' + fmtWon(item.totalCost) + '</td><td>' + fmtWon(item.artistAmount) + ' (' + (item.artistRate || 0) + '%)</td><td style="font-weight:700; color:var(--green);">' + fmtWon(item.netProfit) + '</td><td><span class="badge ' + cls + '">' + label + '</span></td></tr>';
  }).join('');
}
function fmtWon(v) { return '₩' + (parseInt(v) || 0).toLocaleString(); }
function calcConcertSettle() {
  const v = id => parseInt(document.getElementById(id)?.value) || 0;
  const totalRevenue = v('cs-ticket') + v('cs-sponsor') + v('cs-md');
  const totalCost = v('cs-cost-venue') + v('cs-cost-equip') + v('cs-cost-labor') + v('cs-cost-other');
  const artistRate = v('cs-artist-rate');
  const artistAmount = Math.round(totalRevenue * artistRate / 100);
  const netProfit = totalRevenue - totalCost - artistAmount;
  const el = id => document.getElementById(id);
  if (el('cs-total-revenue')) el('cs-total-revenue').value = fmtWon(totalRevenue);
  if (el('cs-artist-amount')) el('cs-artist-amount').value = fmtWon(artistAmount);
  if (el('cs-net-profit')) el('cs-net-profit').value = fmtWon(netProfit);
}
function openConcertSettleModal() {
  ['cs-name','cs-date','cs-ticket','cs-sponsor','cs-md','cs-cost-venue','cs-cost-equip','cs-cost-labor','cs-cost-other','cs-artist-rate','cs-memo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  ['cs-total-revenue','cs-artist-amount','cs-net-profit'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  closeModal('concert-settle-modal'); document.getElementById('concert-settle-modal').classList.add('active');
}
function saveConcertSettle() {
  const v = id => document.getElementById(id)?.value || '';
  const n = id => parseInt(document.getElementById(id)?.value) || 0;
  const name = v('cs-name');
  if (!name) { showToast('공연명을 입력하세요', 'error'); return; }
  const totalRevenue = n('cs-ticket') + n('cs-sponsor') + n('cs-md');
  const totalCost = n('cs-cost-venue') + n('cs-cost-equip') + n('cs-cost-labor') + n('cs-cost-other');
  const artistRate = n('cs-artist-rate');
  const artistAmount = Math.round(totalRevenue * artistRate / 100);
  const netProfit = totalRevenue - totalCost - artistAmount;
  const item = { id: 'cs_' + Date.now(), name: name, date: v('cs-date'), ticketRevenue: n('cs-ticket'), sponsorRevenue: n('cs-sponsor'), mdRevenue: n('cs-md'), totalRevenue: totalRevenue, costVenue: n('cs-cost-venue'), costEquip: n('cs-cost-equip'), costLabor: n('cs-cost-labor'), costOther: n('cs-cost-other'), totalCost: totalCost, artistRate: artistRate, artistAmount: artistAmount, netProfit: netProfit, status: v('cs-status') || 'draft', memo: v('cs-memo') };
  const store = getConcertSettleStore(); store.push(item); localStorage.setItem('bs_concert_settle', JSON.stringify(store));
  closeModal('concert-settle-modal'); renderConcertSettle(); showToast('공연 정산 등록 완료', 'success');
}

// ============================================
// OVERSEAS SETTLEMENT (해외 정산)
// ============================================
function getOverseasSettleStore() {
  const d = localStorage.getItem('bs_overseas_settle');
  return d ? JSON.parse(d) : [];
}
function loadOverseasSettle() { renderOverseasSettle(); }
function renderOverseasSettle() {
  const items = getOverseasSettleStore();
  const tbody = document.getElementById('overseas-settle-table');
  if (!tbody) return;
  if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="8" class="empty-state">해외 정산을 등록하세요.</td></tr>'; return; }
  tbody.innerHTML = items.map(item => {
    return '<tr><td style="font-weight:600;">' + (item.name || '-') + '</td><td>' + (item.country || '-') + '</td><td>' + (item.currency || '-') + '</td><td>' + (parseInt(item.localRevenue) || 0).toLocaleString() + '</td><td>' + (parseFloat(item.exchangeRate) || 0) + '</td><td style="font-weight:700; color:var(--primary);">' + fmtWon(item.krwAmount) + '</td><td style="color:var(--red);">' + fmtWon(item.localTax) + '</td><td style="font-weight:700; color:var(--green);">' + fmtWon(item.netRevenue) + '</td></tr>';
  }).join('');
}
function calcOverseasSettle() {
  const v = id => parseFloat(document.getElementById(id)?.value) || 0;
  const localRevenue = v('os-local-revenue');
  const rate = v('os-exchange-rate');
  const krwAmount = Math.round(localRevenue * rate);
  const localTax = v('os-local-tax');
  const withholding = v('os-withholding');
  const netRevenue = krwAmount - Math.round(localTax * rate) - Math.round(withholding * rate);
  const el = id => document.getElementById(id);
  if (el('os-krw-amount')) el('os-krw-amount').value = fmtWon(krwAmount);
  if (el('os-net-revenue')) el('os-net-revenue').value = fmtWon(netRevenue);
}
function openOverseasSettleModal() {
  ['os-name','os-local-revenue','os-exchange-rate','os-local-tax','os-withholding','os-memo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  ['os-krw-amount','os-net-revenue'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  closeModal('overseas-settle-modal'); document.getElementById('overseas-settle-modal').classList.add('active');
}
function saveOverseasSettle() {
  const v = id => document.getElementById(id)?.value || '';
  const n = id => parseFloat(document.getElementById(id)?.value) || 0;
  const name = v('os-name');
  if (!name) { showToast('프로젝트명을 입력하세요', 'error'); return; }
  const localRevenue = n('os-local-revenue');
  const rate = n('os-exchange-rate');
  const krwAmount = Math.round(localRevenue * rate);
  const localTax = n('os-local-tax');
  const withholding = n('os-withholding');
  const netRevenue = krwAmount - Math.round(localTax * rate) - Math.round(withholding * rate);
  const item = { id: 'os_' + Date.now(), name: name, country: v('os-country'), currency: v('os-currency'), localRevenue: localRevenue, exchangeRate: rate, krwAmount: krwAmount, localTax: localTax, withholding: withholding, netRevenue: netRevenue, memo: v('os-memo') };
  const store = getOverseasSettleStore(); store.push(item); localStorage.setItem('bs_overseas_settle', JSON.stringify(store));
  closeModal('overseas-settle-modal'); renderOverseasSettle(); showToast('해외 정산 등록 완료', 'success');
}

// ============================================
// TICKETS (티켓/판매)
// ============================================
function getTicketStore() {
  const d = localStorage.getItem('bs_tickets');
  return d ? JSON.parse(d) : [];
}
function loadTickets() { renderTickets(); }
function renderTickets() {
  const items = getTicketStore();
  const tbody = document.getElementById('ticket-table');
  if (!tbody) return;
  // Update stats
  const totalSold = items.reduce((s, t) => s + (parseInt(t.sold) || 0), 0);
  const totalRevenue = items.reduce((s, t) => s + (parseInt(t.revenue) || 0), 0);
  const totalSeats = items.reduce((s, t) => s + (parseInt(t.totalSeats) || 0), 0);
  const avgPrice = items.length > 0 ? Math.round(totalRevenue / Math.max(totalSold, 1)) : 0;
  const sellRate = totalSeats > 0 ? Math.round(totalSold / totalSeats * 100) : 0;
  const el = id => document.getElementById(id);
  if (el('ticket-total-sold')) el('ticket-total-sold').textContent = totalSold.toLocaleString();
  if (el('ticket-total-revenue')) el('ticket-total-revenue').textContent = fmtWon(totalRevenue);
  if (el('ticket-avg-price')) el('ticket-avg-price').textContent = fmtWon(avgPrice);
  if (el('ticket-sell-rate')) el('ticket-sell-rate').textContent = sellRate + '%';
  if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">티켓 판매 데이터를 등록하세요.</td></tr>'; return; }
  tbody.innerHTML = items.map(t => {
    const rate = (parseInt(t.totalSeats) || 0) > 0 ? Math.round((parseInt(t.sold) || 0) / parseInt(t.totalSeats) * 100) : 0;
    return '<tr><td style="font-weight:600;">' + (t.name || '-') + '</td><td>' + (t.platform || '-') + '</td><td>' + (parseInt(t.totalSeats) || 0).toLocaleString() + '</td><td>' + (parseInt(t.sold) || 0).toLocaleString() + '</td><td>' + rate + '%</td><td style="font-weight:700; color:var(--green);">' + fmtWon(t.revenue) + '</td><td>' + (t.date || '-') + '</td></tr>';
  }).join('');
}
function calcTicket() {
  const sold = parseInt(document.getElementById('tk-sold')?.value) || 0;
  const price = parseInt(document.getElementById('tk-price')?.value) || 0;
  const rev = sold * price;
  const el = document.getElementById('tk-revenue');
  if (el) el.value = fmtWon(rev);
}
function openTicketModal() {
  ['tk-name','tk-total-seats','tk-sold','tk-price','tk-date','tk-memo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const el = document.getElementById('tk-revenue'); if (el) el.value = '';
  var projSelect = document.getElementById('ticket-project-link');
  if (projSelect) {
    var projects = JSON.parse(localStorage.getItem('bs_projects') || '[]');
    projSelect.innerHTML = '<option value="">없음</option>' + projects.map(function(p) { return '<option value="' + p.id + '">' + p.name + (p.location ? ' (' + p.location + ')' : '') + '</option>'; }).join('');
  }
  closeModal('ticket-modal'); document.getElementById('ticket-modal').classList.add('active');
}
function saveTicket() {
  const v = id => document.getElementById(id)?.value || '';
  const n = id => parseInt(document.getElementById(id)?.value) || 0;
  const name = v('tk-name');
  if (!name) { showToast('공연명을 입력하세요', 'error'); return; }
  const sold = n('tk-sold');
  const price = n('tk-price');
  const item = { id: 'tk_' + Date.now(), name: name, platform: v('tk-platform'), totalSeats: n('tk-total-seats'), sold: sold, price: price, revenue: sold * price, date: v('tk-date'), memo: v('tk-memo'), linkedProject: document.getElementById('ticket-project-link')?.value || '' };
  const store = getTicketStore(); store.push(item); localStorage.setItem('bs_tickets', JSON.stringify(store));
  closeModal('ticket-modal'); renderTickets(); showToast('티켓 데이터 등록 완료', 'success');
}

// ============================================
// TRAVEL (출장 관리)
// ============================================
function getTravelStore() {
  const d = localStorage.getItem('bs_travel');
  if (d) return JSON.parse(d);
  const defaults = [
    { id: 'tv_sample1', name: '[샘플] 싱가포르 공연장 답사', country: '싱가포르', city: 'Marina Bay', startDate: '2026-05-15', endDate: '2026-05-18', purpose: '공연장섭외', estimatedCost: 5000000, actualCost: 0, status: 'planned', assignee: '', memo: 'Marina Bay Sands 공연장 계약 미팅' }
  ];
  localStorage.setItem('bs_travel', JSON.stringify(defaults));
  return defaults;
}
function loadTravel() { renderTravel(); }
function renderTravel() {
  const items = getTravelStore();
  const tbody = document.getElementById('travel-table');
  if (!tbody) return;
  if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="8" class="empty-state">출장 정보를 등록하세요.</td></tr>'; return; }
  const statusMap = { planned: ['계획','badge-pending'], approved: ['승인','badge-approved'], ongoing: ['진행중','badge-pending'], completed: ['완료','badge-approved'], cancelled: ['취소','badge-rejected'] };
  const purposeMap = { '공연장섭외': '공연장 섭외', '파트너미팅': '파트너 미팅', '투자미팅': '투자 미팅', '아티스트미팅': '아티스트 미팅', '현장답사': '현장 답사', '기타': '기타' };
  tbody.innerHTML = items.map(t => {
    const [label, cls] = statusMap[t.status] || ['계획','badge-pending'];
    return '<tr><td style="font-weight:600;">' + (t.name || '-') + '</td><td>' + (t.country || '') + ' ' + (t.city || '') + '</td><td style="font-size:14px;">' + (t.startDate || '') + ' ~ ' + (t.endDate || '') + '</td><td>' + (purposeMap[t.purpose] || t.purpose || '-') + '</td><td>' + fmtWon(t.estimatedCost) + '</td><td>' + (t.actualCost ? fmtWon(t.actualCost) : '-') + '</td><td><span class="badge ' + cls + '">' + label + '</span></td><td>' + (t.assignee || '-') + '</td></tr>';
  }).join('');
}
function openTravelModal() {
  ['tv-name','tv-city','tv-start','tv-end','tv-est-cost','tv-act-cost','tv-assignee','tv-memo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  closeModal('travel-modal'); document.getElementById('travel-modal').classList.add('active');
}
function saveTravel() {
  const v = id => document.getElementById(id)?.value || '';
  const n = id => parseInt(document.getElementById(id)?.value) || 0;
  const name = v('tv-name');
  if (!name) { showToast('출장명을 입력하세요', 'error'); return; }
  const item = { id: 'tv_' + Date.now(), name: name, country: v('tv-country'), city: v('tv-city'), startDate: v('tv-start'), endDate: v('tv-end'), purpose: v('tv-purpose'), estimatedCost: n('tv-est-cost'), actualCost: n('tv-act-cost'), status: v('tv-status') || 'planned', assignee: v('tv-assignee'), memo: v('tv-memo') };
  const store = getTravelStore(); store.push(item); localStorage.setItem('bs_travel', JSON.stringify(store));
  closeModal('travel-modal'); renderTravel(); showToast('출장 등록 완료', 'success');
}

// ============================================
// 파트너 관리 (파트너/스폰서 관계 관리)
// ============================================
let currentCRMTab = 'all';
function getCRMStore() {
  const d = localStorage.getItem('bs_crm');
  if (d) return JSON.parse(d);
  const defaults = [
    { id: 'crm_s1', company: '[샘플] Marina Bay Sands', type: 'venue', country: '싱가포르', contact: 'John Lee', title: 'Event Manager', email: 'events@mbs.com', phone: '', lastMeeting: '2026-04-01', nextMeeting: '2026-05-15', status: 'active', memo: '2026 페스티벌 공연장 후보' },
    { id: 'crm_s2', company: '[샘플] Global Sound Tech', type: 'partner', country: '미국', contact: 'Mike Johnson', title: 'CEO', email: 'mike@gst.com', phone: '', lastMeeting: '', nextMeeting: '', status: 'new', memo: '공연기술 외주 업체' }
  ];
  localStorage.setItem('bs_crm', JSON.stringify(defaults));
  return defaults;
}
function loadCRM() { renderCRM(); }
function switchCRMTab(tab) {
  currentCRMTab = tab;
  document.querySelectorAll('[id^="crm-tab-"]').forEach(b => b.className = 'btn btn-sm btn-secondary');
  const active = document.getElementById('crm-tab-' + tab);
  if (active) active.className = 'btn btn-sm btn-primary';
  renderCRM();
}
function renderCRM() {
  const all = getCRMStore();
  const items = currentCRMTab === 'all' ? all : all.filter(c => c.type === currentCRMTab);
  const tbody = document.getElementById('crm-table');
  if (!tbody) return;
  const typeMap = { partner: '파트너', sponsor: '스폰서', investor: '투자자', venue: '공연장', agency: '에이전시', media: '미디어' };
  const statusMap = { 'new': ['신규','badge-pending'], active: ['활성','badge-approved'], inactive: ['비활성','badge-rejected'], vip: ['VIP','badge-approved'] };
  if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="8" class="empty-state">파트너 정보를 등록하세요.</td></tr>'; return; }
  tbody.innerHTML = items.map(c => {
    const [statusLabel, statusCls] = statusMap[c.status] || ['신규','badge-pending'];
    return '<tr><td style="font-weight:600;">' + (c.company || '-') + '</td><td>' + (typeMap[c.type] || c.type) + '</td><td>' + (c.country || '-') + '</td><td>' + (c.contact || '-') + '</td><td style="font-size:14px;">' + (c.email || c.phone || '-') + '</td><td>' + (c.lastMeeting || '-') + '</td><td><span class="badge ' + statusCls + '">' + statusLabel + '</span></td><td style="font-size:14px; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + (c.memo || '-') + '</td></tr>';
  }).join('');
}
function openCRMModal() {
  ['crm-company','crm-country','crm-contact','crm-title','crm-email','crm-phone','crm-last-meeting','crm-next-meeting','crm-memo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  var projSelect = document.getElementById('crm-project-link');
  if (projSelect) {
    var projects = JSON.parse(localStorage.getItem('bs_projects') || '[]');
    projSelect.innerHTML = '<option value="">없음</option>' + projects.map(function(p) { return '<option value="' + p.id + '">' + p.name + (p.location ? ' (' + p.location + ')' : '') + '</option>'; }).join('');
  }
  closeModal('crm-modal'); document.getElementById('crm-modal').classList.add('active');
}
function saveCRM() {
  const v = id => document.getElementById(id)?.value || '';
  const company = v('crm-company');
  if (!company) { showToast('회사/이름을 입력하세요', 'error'); return; }
  const item = { id: 'crm_' + Date.now(), company: company, type: v('crm-type') || 'partner', country: v('crm-country'), contact: v('crm-contact'), title: v('crm-title'), email: v('crm-email'), phone: v('crm-phone'), lastMeeting: v('crm-last-meeting'), nextMeeting: v('crm-next-meeting'), status: v('crm-status') || 'new', memo: v('crm-memo'), linkedProject: document.getElementById('crm-project-link')?.value || '' };
  const store = getCRMStore(); store.push(item); localStorage.setItem('bs_crm', JSON.stringify(store));
  closeModal('crm-modal'); renderCRM(); showToast('파트너 관리 등록 완료', 'success');
}

// Stub functions for removed features (prevent console errors)
function deleteClient() {}
function openClientModal() {}
function saveClient() {}
function switchClientTab() {}
function generateAllPayslips() {
  const hrData = JSON.parse(localStorage.getItem('bs_hr_data') || '{}');
  Object.keys(hrData).forEach((id, i) => {
    setTimeout(() => { if (typeof downloadPayslip === 'function') downloadPayslip(id); }, i * 300);
  });
}

// ============================================
// GLOBAL HOLIDAY CALENDAR
// ============================================

const GLOBAL_HOLIDAYS = {
  'KR': { name: '\uD55C\uAD6D', flag: '\uD83C\uDDF0\uD83C\uDDF7', holidays: {
    '01-01': 'New Year\'s Day (\uC2E0\uC815)',
    '02-17': 'Lunar New Year (\uC124\uB0A0)',
    '02-18': 'Lunar New Year (\uC124\uB0A0)',
    '02-19': 'Lunar New Year (\uC124\uB0A0)',
    '03-01': 'Independence Movement Day (\uC0BC\uC77C\uC808)',
    '05-05': 'Children\'s Day (\uC5B4\uB9B0\uC774\uB0A0)',
    '05-24': 'Buddha\'s Birthday (\uC11D\uAC00\uD0C4\uC2E0\uC77C)',
    '06-06': 'Memorial Day (\uD604\uCDA9\uC77C)',
    '08-15': 'Liberation Day (\uAD11\uBCF5\uC808)',
    '09-24': 'Chuseok (\uCD94\uC11D)',
    '09-25': 'Chuseok (\uCD94\uC11D)',
    '09-26': 'Chuseok (\uCD94\uC11D)',
    '10-03': 'National Foundation Day (\uAC1C\uCC9C\uC808)',
    '10-09': 'Hangul Day (\uD55C\uAE00\uB0A0)',
    '12-25': 'Christmas Day (\uC131\uD0C4\uC808)'
  }},
  'JP': { name: '\uC77C\uBCF8', flag: '\uD83C\uDDEF\uD83C\uDDF5', holidays: {
    '01-01': 'New Year\'s Day',
    '01-12': 'Coming of Age Day',
    '02-11': 'National Foundation Day',
    '02-23': 'Emperor\'s Birthday',
    '03-20': 'Vernal Equinox Day',
    '04-29': 'Sh\u014Dwa Day',
    '05-03': 'Constitution Memorial Day',
    '05-04': 'Greenery Day',
    '05-05': 'Children\'s Day',
    '07-20': 'Marine Day',
    '08-11': 'Mountain Day',
    '09-21': 'Respect for the Aged Day',
    '09-23': 'Autumnal Equinox Day',
    '10-12': 'Sports Day',
    '11-03': 'Culture Day',
    '11-23': 'Labor Thanksgiving Day',
    '12-25': 'Christmas Day'
  }},
  'SG': { name: '\uC2F1\uAC00\uD3EC\uB974', flag: '\uD83C\uDDF8\uD83C\uDDEC', holidays: {
    '01-01': 'New Year\'s Day',
    '02-17': 'Chinese New Year',
    '03-20': 'Hari Raya Puasa',
    '04-03': 'Good Friday',
    '05-01': 'Labour Day / Vesak Day',
    '05-27': 'Hari Raya Haji',
    '08-09': 'National Day',
    '10-20': 'Deepavali',
    '12-25': 'Christmas Day'
  }},
  'US': { name: '\uBBF8\uAD6D', flag: '\uD83C\uDDFA\uD83C\uDDF8', holidays: {
    '01-01': 'New Year\'s Day',
    '01-19': 'Martin Luther King Jr. Day',
    '02-16': 'Presidents\' Day',
    '05-25': 'Memorial Day',
    '06-19': 'Juneteenth',
    '07-04': 'Independence Day',
    '09-07': 'Labor Day',
    '10-12': 'Indigenous Peoples\' Day',
    '11-11': 'Veterans Day',
    '11-26': 'Thanksgiving Day',
    '12-25': 'Christmas Day'
  }},
  'GB': { name: '\uC601\uAD6D', flag: '\uD83C\uDDEC\uD83C\uDDE7', holidays: {
    '01-01': 'New Year\'s Day',
    '04-03': 'Good Friday',
    '04-06': 'Easter Monday',
    '05-04': 'Early May Bank Holiday',
    '05-25': 'Spring Bank Holiday',
    '08-31': 'Summer Bank Holiday',
    '12-25': 'Christmas Day',
    '12-26': 'Boxing Day'
  }},
  'CN': { name: '\uC911\uAD6D', flag: '\uD83C\uDDE8\uD83C\uDDF3', holidays: {
    '01-01': 'New Year\'s Day',
    '02-17': 'Spring Festival',
    '02-18': 'Spring Festival',
    '04-05': 'Qing Ming Festival',
    '05-01': 'Labour Day',
    '05-31': 'Dragon Boat Festival',
    '09-25': 'Mid-Autumn Festival',
    '10-01': 'National Day'
  }},
  'TW': { name: '\uB300\uB9CC', flag: '\uD83C\uDDF9\uD83C\uDDFC', holidays: {
    '01-01': 'New Year\'s Day',
    '02-17': 'Chinese New Year Holiday',
    '02-18': 'Lunar New Year',
    '02-28': '228 Peace Memorial Day',
    '04-04': 'Children\'s Day Holiday',
    '04-05': 'Qing Ming Festival',
    '05-01': 'Labour Day',
    '05-31': 'Dragon Boat Festival Holiday',
    '09-25': 'Mid-Autumn Festival',
    '10-10': 'ROC National Day',
    '12-25': 'Christmas Day'
  }},
  'TH': { name: '\uD0DC\uAD6D', flag: '\uD83C\uDDF9\uD83C\uDDED', holidays: {
    '01-01': 'New Year\'s Day',
    '04-13': 'Songkran Festival',
    '04-14': 'Songkran Festival',
    '04-15': 'Songkran Festival',
    '05-01': 'Labour Day',
    '05-05': 'Coronation Day',
    '05-11': 'Visakha Bucha Holiday',
    '06-03': 'Queen Suthida\'s Birthday',
    '07-10': 'Buddhist Lent Day',
    '07-28': 'King Vajiralongkorn\'s Birthday',
    '08-12': 'Queen Mother\'s Birthday',
    '10-13': 'King Bhumibol Memorial Day',
    '10-23': 'Chulalongkorn Memorial Day',
    '12-05': 'King Bhumibol\'s Birthday',
    '12-10': 'Constitution Day'
  }},
  'ID': { name: '\uC778\uB3C4\uB124\uC2DC\uC544', flag: '\uD83C\uDDEE\uD83C\uDDE9', holidays: {
    '01-01': 'New Year\'s Day',
    '01-17': 'Isra Mi\'raj',
    '02-17': 'Chinese New Year',
    '03-20': 'Eid al-Fitr',
    '03-21': 'Idul Fitri',
    '04-03': 'Good Friday',
    '05-01': 'Labour Day / Waisak Day',
    '05-27': 'Eid al-Adha',
    '05-29': 'Ascension Day of Jesus Christ',
    '06-01': 'Pancasila Day',
    '06-17': 'Islamic New Year',
    '08-17': 'Independence Day',
    '12-25': 'Christmas Day'
  }},
  'MY': { name: '\uB9D0\uB808\uC774\uC2DC\uC544', flag: '\uD83C\uDDF2\uD83C\uDDFE', holidays: {
    '01-01': 'New Year\'s Day',
    '02-17': 'Chinese New Year',
    '03-20': 'Hari Raya Aidilfitri',
    '03-21': 'Hari Raya Aidilfitri Holiday',
    '05-01': 'Labour Day',
    '06-02': 'Agong\'s Birthday',
    '05-27': 'Hari Raya Haji',
    '08-26': 'Prophet Muhammad\'s Birthday',
    '08-31': 'Malaysia\'s National Day',
    '09-16': 'Malaysia Day Holiday',
    '10-20': 'Deepavali',
    '12-25': 'Christmas Day'
  }},
  'PH': { name: '\uD544\uB9AC\uD540', flag: '\uD83C\uDDF5\uD83C\uDDED', holidays: {
    '01-01': 'New Year\'s Day',
    '04-09': 'Day of Valor',
    '04-02': 'Maundy Thursday',
    '04-03': 'Good Friday',
    '04-04': 'Black Saturday',
    '05-01': 'Labor Day',
    '06-12': 'Independence Day',
    '08-21': 'Ninoy Aquino Day',
    '08-25': 'National Heroes Day',
    '11-01': 'All Saints\' Day',
    '11-30': 'Bonifacio Day',
    '12-25': 'Christmas Day',
    '12-30': 'Rizal Day',
    '12-31': 'New Year\'s Eve'
  }},
  'VN': { name: '\uBCA0\uD2B8\uB0A8', flag: '\uD83C\uDDFB\uD83C\uDDF3', holidays: {
    '01-01': 'New Year\'s Day',
    '02-17': 'Tet (Traditional New Year)',
    '04-07': 'Hung Kings Commemoration Day',
    '04-30': 'Reunification Day',
    '05-01': 'Labour Day',
    '09-02': 'National Day'
  }},
  'AU': { name: '\uD638\uC8FC', flag: '\uD83C\uDDE6\uD83C\uDDFA', holidays: {
    '01-01': 'New Year\'s Day',
    '01-26': 'Australia Day',
    '04-03': 'Good Friday',
    '04-06': 'Easter Monday',
    '04-25': 'Anzac Day',
    '06-08': 'King\'s Birthday',
    '12-25': 'Christmas Day',
    '12-26': 'Boxing Day'
  }},
  'NZ': { name: '\uB274\uC9C8\uB79C\uB4DC', flag: '\uD83C\uDDF3\uD83C\uDDFF', holidays: {
    '01-01': 'New Year\'s Day',
    '01-02': 'Day after New Year\'s Day',
    '02-06': 'Waitangi Day',
    '04-03': 'Good Friday',
    '04-06': 'Easter Monday',
    '04-25': 'Anzac Day',
    '06-01': 'King\'s Birthday',
    '06-19': 'Matariki',
    '10-26': 'Labour Day',
    '12-25': 'Christmas Day',
    '12-26': 'Boxing Day'
  }},
  'FR': { name: '\uD504\uB791\uC2A4', flag: '\uD83C\uDDEB\uD83C\uDDF7', holidays: {
    '01-01': 'New Year\'s Day',
    '04-06': 'Easter Monday',
    '05-01': 'Labour Day',
    '05-08': 'Victory Day',
    '05-14': 'Ascension Day',
    '05-25': 'Whit Monday',
    '07-14': 'Bastille Day',
    '08-15': 'Assumption Day',
    '11-01': 'All Saints\' Day',
    '11-11': 'Armistice Day',
    '12-25': 'Christmas Day'
  }},
  'DE': { name: '\uB3C5\uC77C', flag: '\uD83C\uDDE9\uD83C\uDDEA', holidays: {
    '01-01': 'New Year\'s Day',
    '04-03': 'Good Friday',
    '04-06': 'Easter Monday',
    '05-01': 'May Day',
    '05-14': 'Ascension Day',
    '05-25': 'Whit Monday',
    '10-03': 'Day of German Unity',
    '12-25': 'Christmas Day',
    '12-26': 'Boxing Day'
  }},
  'AE': { name: 'UAE', flag: '\uD83C\uDDE6\uD83C\uDDEA', holidays: {
    '01-01': 'New Year\'s Day',
    '03-20': 'Eid al-Fitr Holiday',
    '03-21': 'Eid al-Fitr Holiday',
    '05-26': 'Arafat Day',
    '05-27': 'Eid al-Adha Holiday',
    '05-28': 'Eid al-Adha Holiday',
    '06-17': 'Islamic New Year',
    '12-02': 'National Day',
    '12-03': 'National Day Holiday'
  }},
  'SA': { name: '\uC0AC\uC6B0\uB514', flag: '\uD83C\uDDF8\uD83C\uDDE6', holidays: {
    '02-22': 'Founding Day',
    '03-20': 'Eid al-Fitr Holiday',
    '03-21': 'Eid al-Fitr Holiday',
    '03-22': 'Eid al-Fitr Holiday',
    '05-26': 'Eid al-Adha Holiday',
    '05-27': 'Eid al-Adha Holiday',
    '05-28': 'Eid al-Adha Holiday',
    '09-23': 'National Day'
  }},
  'BR': { name: '\uBE0C\uB77C\uC9C8', flag: '\uD83C\uDDE7\uD83C\uDDF7', holidays: {
    '01-01': 'New Year\'s Day',
    '02-17': 'Carnival',
    '04-03': 'Good Friday',
    '04-21': 'Tiradentes Day',
    '05-01': 'Labour Day',
    '06-04': 'Corpus Christi',
    '09-07': 'Independence Day',
    '10-12': 'Our Lady of Aparecida',
    '11-02': 'All Souls\' Day',
    '11-15': 'Republic Day',
    '11-20': 'Black Awareness Day',
    '12-25': 'Christmas Day'
  }},
  'MX': { name: '\uBA55\uC2DC\uCF54', flag: '\uD83C\uDDF2\uD83C\uDDFD', holidays: {
    '01-01': 'New Year\'s Day',
    '02-02': 'Constitution Day',
    '03-16': 'Benito Juarez Day',
    '05-01': 'Labor Day',
    '09-16': 'Independence Day',
    '11-16': 'Revolution Day',
    '12-25': 'Christmas Day'
  }},
  'CA': { name: '\uCE90\uB098\uB2E4', flag: '\uD83C\uDDE8\uD83C\uDDE6', holidays: {
    '01-01': 'New Year\'s Day',
    '04-03': 'Good Friday',
    '05-18': 'Victoria Day',
    '07-01': 'Canada Day',
    '08-03': 'Civic Holiday',
    '09-07': 'Labour Day',
    '09-30': 'Truth and Reconciliation',
    '10-12': 'Thanksgiving',
    '11-11': 'Remembrance Day',
    '12-25': 'Christmas Day',
    '12-26': 'Boxing Day'
  }}
};

const RAMADAN_2026 = { start: '02-18', end: '03-19', note: 'Ramadan 2026 (\uB77C\uB9C8\uB2E8)' };

const DST_2026 = {
  'US': { start: '03-08', end: '11-01', label: 'DST (UTC-4\u2192-5)', note: 'Spring Forward Mar 8, Fall Back Nov 1' },
  'CA': { start: '03-08', end: '11-01', label: 'DST (varies)', note: 'Same as US' },
  'GB': { start: '03-29', end: '10-25', label: 'BST (UTC+1)', note: 'British Summer Time' },
  'FR': { start: '03-29', end: '10-25', label: 'CEST (UTC+2)', note: 'Central European Summer Time' },
  'DE': { start: '03-29', end: '10-25', label: 'CEST (UTC+2)', note: 'Central European Summer Time' },
  'AU': { start: '10-04', end: '04-05', label: 'AEDT (UTC+11)', note: 'Australian Eastern Daylight Time (Oct-Apr)' },
  'NZ': { start: '09-27', end: '04-05', label: 'NZDT (UTC+13)', note: 'NZ Daylight Time (Sep-Apr)' },
  'MX': { start: '04-05', end: '10-25', label: 'CDT (UTC-5)', note: 'Mexico DST' },
  'BR': { start: 'none', end: 'none', label: 'No DST', note: 'Brazil abolished DST in 2019' },
  'CL': { start: '04-04', end: '09-05', label: 'CLT (UTC-4)', note: 'Chile Standard Time (Apr-Sep), CLST (UTC-3) rest' }
};

let selectedCountries = ['KR', 'JP', 'SG', 'US', 'GB', 'TH'];
let globalCalMonth = new Date().getMonth();
let globalCalYear = new Date().getFullYear();

function loadGlobalCal() {
  const saved = localStorage.getItem('bs_global_cal_countries');
  if (saved) { try { selectedCountries = JSON.parse(saved); } catch(e) {} }
  const yearSelect = document.getElementById('global-cal-year');
  if (yearSelect) yearSelect.value = globalCalYear;
  renderCountryFilter();
  renderGlobalCal();
}

function renderCountryFilter() {
  var container = document.getElementById('global-cal-countries');
  if (!container) return;
  container.innerHTML = Object.entries(GLOBAL_HOLIDAYS).map(function(entry) {
    var code = entry[0], country = entry[1];
    var checked = selectedCountries.includes(code);
    return '<label style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; background:' + (checked ? 'var(--primary-bg)' : 'var(--gray-50)') + '; border:1px solid ' + (checked ? 'var(--primary)' : 'var(--gray-200)') + '; border-radius:6px; font-size:14px; cursor:pointer; white-space:nowrap;">' +
      '<input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="toggleCountry(\'' + code + '\', this)" style="display:none;">' +
      country.flag + ' ' + country.name +
    '</label>';
  }).join('');
}

function toggleCountry(code, el) {
  if (el.checked) { if (!selectedCountries.includes(code)) selectedCountries.push(code); }
  else { selectedCountries = selectedCountries.filter(function(c) { return c !== code; }); }
  localStorage.setItem('bs_global_cal_countries', JSON.stringify(selectedCountries));
  renderCountryFilter();
  renderGlobalCal();
}

function prevGlobalMonth() {
  globalCalMonth--;
  if (globalCalMonth < 0) { globalCalMonth = 11; globalCalYear--; }
  var yearSelect = document.getElementById('global-cal-year');
  if (yearSelect) yearSelect.value = globalCalYear;
  renderGlobalCal();
}

function nextGlobalMonth() {
  globalCalMonth++;
  if (globalCalMonth > 11) { globalCalMonth = 0; globalCalYear++; }
  var yearSelect = document.getElementById('global-cal-year');
  if (yearSelect) yearSelect.value = globalCalYear;
  renderGlobalCal();
}

function renderGlobalCal() {
  var yearSelect = document.getElementById('global-cal-year');
  if (yearSelect) globalCalYear = parseInt(yearSelect.value) || new Date().getFullYear();

  var label = document.getElementById('global-cal-month-label');
  var monthNames = ['1\uC6D4','2\uC6D4','3\uC6D4','4\uC6D4','5\uC6D4','6\uC6D4','7\uC6D4','8\uC6D4','9\uC6D4','10\uC6D4','11\uC6D4','12\uC6D4'];
  if (label) label.textContent = globalCalYear + '\uB144 ' + monthNames[globalCalMonth];

  var thead = document.getElementById('global-cal-header');
  var tbody = document.getElementById('global-cal-body');
  if (!thead || !tbody) return;

  var dayNames = ['\uC77C','\uC6D4','\uD654','\uC218','\uBAA9','\uAE08','\uD1A0'];

  thead.innerHTML = '<tr style="background:var(--gray-50);"><th style="width:40px; text-align:center;">Day</th><th style="width:40px; text-align:center;">DOW</th>' +
    selectedCountries.map(function(code) {
      var c = GLOBAL_HOLIDAYS[code];
      return '<th style="min-width:140px; font-size:14px; text-align:center;">' + (c ? c.flag + ' ' + c.name : code) + '</th>';
    }).join('') + '</tr>';

  var daysInMonth = new Date(globalCalYear, globalCalMonth + 1, 0).getDate();
  var html = '';

  for (var d = 1; d <= daysInMonth; d++) {
    var date = new Date(globalCalYear, globalCalMonth, d);
    var dow = date.getDay();
    var dateKey = String(globalCalMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    var isWeekend = dow === 0 || dow === 6;
    var isSunday = dow === 0;

    var hasHoliday = false;
    selectedCountries.forEach(function(code) {
      if (GLOBAL_HOLIDAYS[code] && GLOBAL_HOLIDAYS[code].holidays[dateKey]) hasHoliday = true;
    });

    var isRamadan = (globalCalYear === 2026) && (dateKey >= RAMADAN_2026.start && dateKey <= RAMADAN_2026.end);

    var rowBg = hasHoliday ? 'background:var(--primary-bg);' : isRamadan ? 'background:#FFF8E1;' : isWeekend ? 'background:var(--gray-50);' : '';
    var dayColor = isSunday ? 'color:var(--red, #FF3B30);' : dow === 6 ? 'color:var(--blue, #007AFF);' : '';

    html += '<tr style="' + rowBg + '">';
    html += '<td style="text-align:center; font-weight:700; ' + dayColor + '">' + d + '</td>';
    html += '<td style="text-align:center; font-size:14px; ' + dayColor + '">' + dayNames[dow] + '</td>';

    selectedCountries.forEach(function(code) {
      var country = GLOBAL_HOLIDAYS[code];
      var holiday = country && country.holidays[dateKey];
      var dst = DST_2026[code];
      var dstText = '';
      if (dst && dst.start !== 'none' && globalCalYear === 2026) {
        if (dateKey === dst.start) {
          dstText = '<div style="font-size:13px; color:#007AFF; margin-top:2px;">\uD83D\uDD50 DST Start (Spring Forward)</div>';
        } else if (dateKey === dst.end) {
          dstText = '<div style="font-size:13px; color:#007AFF; margin-top:2px;">\uD83D\uDD50 DST End (Fall Back)</div>';
        }
      }
      if (holiday) {
        html += '<td style="font-size:14px; padding:6px 8px; background:rgba(255,59,48,0.08); border-left:2px solid var(--primary, #FF3B30);"><strong style="color:var(--primary, #FF3B30);">' + holiday + '</strong>' + dstText + '</td>';
      } else if (isRamadan && ['ID','MY','AE','SA'].includes(code)) {
        html += '<td style="font-size:14px; color:#B8860B; padding:6px 8px;">\uD83C\uDF19 Ramadan' + dstText + '</td>';
      } else if (dstText) {
        html += '<td style="padding:6px 8px;">' + dstText + '</td>';
      } else {
        html += '<td></td>';
      }
    });

    html += '</tr>';
  }

  tbody.innerHTML = html;

  // DST Legend
  var dstLegendEl = document.getElementById('global-cal-dst-legend');
  if (!dstLegendEl) {
    dstLegendEl = document.createElement('div');
    dstLegendEl.id = 'global-cal-dst-legend';
    var tableParent = tbody.closest('table');
    if (tableParent && tableParent.parentNode) {
      tableParent.parentNode.insertBefore(dstLegendEl, tableParent.nextSibling);
    }
  }
  if (dstLegendEl && globalCalYear === 2026) {
    var legendHtml = '<div style="margin-top:12px; padding:12px 16px; background:#F0F7FF; border:1px solid #B3D4FC; border-radius:8px; font-size:14px;">';
    legendHtml += '<strong style="color:#007AFF;">\uD83D\uDD50 Daylight Saving Time (DST) 2026</strong>';
    legendHtml += '<div style="display:flex; flex-wrap:wrap; gap:8px 16px; margin-top:8px;">';
    selectedCountries.forEach(function(code) {
      var dst = DST_2026[code];
      if (dst) {
        var countryInfo = GLOBAL_HOLIDAYS[code];
        var flag = countryInfo ? countryInfo.flag : '';
        legendHtml += '<span style="white-space:nowrap;">' + flag + ' <strong>' + code + '</strong>: ' + dst.label + ' \u2014 ' + dst.note + '</span>';
      }
    });
    legendHtml += '</div></div>';
    dstLegendEl.innerHTML = legendHtml;
  } else if (dstLegendEl) {
    dstLegendEl.innerHTML = '';
  }
}
