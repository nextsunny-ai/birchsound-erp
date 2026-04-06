// ============================================
// SETTLEMENT ENGINE - 수익원별 정산
// ============================================

// SheetJS CDN is loaded in dashboard.html

// 파싱된 데이터 저장
let parsedData = null;
let settlementResults = null;

// ---- 드래그앤드롭 설정 ----
document.addEventListener('DOMContentLoaded', () => {
  const dropzone = document.getElementById('settle-dropzone');
  if (!dropzone) return;

  dropzone.addEventListener('click', () => {
    document.getElementById('settle-file-input').click();
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--primary)';
    dropzone.style.background = 'rgba(46, 196, 182, 0.05)';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--gray-300)';
    dropzone.style.background = '';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--gray-300)';
    dropzone.style.background = '';
    if (e.dataTransfer.files.length) {
      handleSettleFile(e.dataTransfer.files[0]);
    }
  });

  // 기본 정산 월 설정 (지난 달)
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  const monthInput = document.getElementById('settle-month');
  if (monthInput) {
    monthInput.value = lastMonth.getFullYear() + '-' + String(lastMonth.getMonth() + 1).padStart(2, '0');
  }
});

// ---- 엑셀 파일 처리 ----
function handleSettleFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      parsedData = parseSettlementData(jsonData);

      document.getElementById('settle-file-info').style.display = 'block';
      document.getElementById('settle-file-name').textContent = file.name + ' — ' + parsedData.length + '개 항목';
      document.getElementById('settle-step2').style.display = 'block';
      document.getElementById('settle-dropzone').style.borderColor = 'var(--green)';

      showToast(file.name + ' 로드 완료! ' + parsedData.length + '개 항목 감지', 'success');
    } catch (err) {
      showToast('파일 읽기 실패: ' + err.message, 'error');
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

// ---- 데이터 파싱 ----
function parseSettlementData(rows) {
  const items = [];
  let headerRow = -1;

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    const rowStr = row.join(',');
    if (rowStr.includes('상품명') || rowStr.includes('NO') || rowStr.includes('항목')) {
      headerRow = i;
      break;
    }
  }

  if (headerRow === -1) {
    showToast('엑셀 형식을 인식할 수 없습니다.', 'error');
    return [];
  }

  const headers = rows[headerRow];
  let colMap = {};
  headers.forEach((h, idx) => {
    const hs = String(h).replace(/\n/g, '').trim();
    if (hs === 'NO') colMap.no = idx;
    if (hs === '대분류') colMap.cat1 = idx;
    if (hs === '중분류') colMap.cat2 = idx;
    if (hs === '소분류') colMap.cat3 = idx;
    if (hs.includes('상품') && hs.includes('코드')) colMap.code = idx;
    if (hs === '상품명' || hs === '항목') colMap.name = idx;
    if (hs === '바코드') colMap.barcode = idx;
    if (hs.includes('매출') && hs.includes('수량')) colMap.qty = idx;
    if (hs === '총매출' || hs === '금액') colMap.totalSales = idx;
    if (hs === '순매출') colMap.netSales = idx;
    if (hs === 'NET매출') colMap.netAmount = idx;
    if (hs === '부가세') colMap.vat = idx;
  });

  let currentCat3 = '';
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const firstCell = String(row[0] || '').trim();
    if (firstCell === '합계' || firstCell === '') {
      if (row[colMap.cat3]) currentCat3 = String(row[colMap.cat3]).trim();
      if (firstCell === '합계') continue;
      if (!row[colMap.name] && !row[colMap.code]) continue;
    }

    const no = parseNum(row[colMap.no]);
    if (!no && firstCell !== '' && isNaN(parseInt(firstCell))) continue;

    if (row[colMap.cat3] && String(row[colMap.cat3]).trim()) {
      currentCat3 = String(row[colMap.cat3]).trim();
    }

    const productName = String(row[colMap.name] || '').trim();
    if (!productName) continue;

    items.push({
      no: no,
      category1: String(row[colMap.cat1] || '').trim(),
      category2: String(row[colMap.cat2] || '').trim(),
      category3: currentCat3,
      code: String(row[colMap.code] || '').trim(),
      name: productName,
      barcode: String(row[colMap.barcode] || '').trim(),
      qty: parseNum(row[colMap.qty]),
      totalSales: parseNum(row[colMap.totalSales]),
      netSales: parseNum(row[colMap.netSales]),
      netAmount: parseNum(row[colMap.netAmount]),
      vat: parseNum(row[colMap.vat]),
    });
  }

  return items;
}

// ---- 숫자 파싱 ----
function parseNum(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  return parseInt(String(val).replace(/[,₩\s%]/g, '')) || 0;
}

// ---- 정산 계산 실행 ----
function runSettlement() {
  if (!parsedData || parsedData.length === 0) {
    showToast('먼저 엑셀 파일을 업로드하세요.', 'error');
    return;
  }

  const cardFeeRate = parseFloat(document.getElementById('settle-card-fee').value) / 100;
  const settleMonth = document.getElementById('settle-month').value;

  const byCategory = {};
  parsedData.forEach(item => {
    const cat = item.category3 || item.category2 || '미분류';
    if (!byCategory[cat]) {
      byCategory[cat] = { name: cat, items: [], totalSales: 0, netSales: 0, netAmount: 0, vat: 0, qty: 0, cardSales: 0, cashSales: 0 };
    }
    const entry = byCategory[cat];
    entry.items.push(item);
    entry.totalSales += item.totalSales;
    entry.netSales += item.netSales;
    entry.netAmount += item.netAmount;
    entry.vat += item.vat;
    entry.qty += item.qty;
    entry.cardSales += item.totalSales;
  });

  const results = [];
  let grandTotal = { totalSales: 0, netSales: 0, cardSales: 0, cashSales: 0, afterFee: 0, publisherShare: 0, gmShare: 0 };

  Object.values(byCategory).forEach(cat => {
    const rate = 0.25; // default rate
    const netAfterVat = cat.netAmount;
    const cardFee = cat.cardSales > 0 ? Math.round(netAfterVat * cardFeeRate) : 0;
    const afterFee = netAfterVat - cardFee;
    const gmShare = Math.round(afterFee * rate);
    const partnerShare = afterFee - gmShare;

    const result = {
      name: cat.name,
      totalSales: cat.totalSales,
      netSales: cat.netSales,
      netAmount: cat.netAmount,
      vat: cat.vat,
      cardSales: cat.cardSales,
      cashSales: cat.cashSales,
      afterFee: afterFee,
      rate: rate,
      rateType: 'net',
      publisherShare: partnerShare,
      gmShare: gmShare,
      taxAmount: Math.round(partnerShare * 0.1),
      totalPayable: partnerShare + Math.round(partnerShare * 0.1),
      items: cat.items,
      qty: cat.qty,
      month: settleMonth,
    };
    results.push(result);
    grandTotal.totalSales += cat.totalSales;
    grandTotal.netSales += cat.netSales;
    grandTotal.cardSales += cat.cardSales;
    grandTotal.cashSales += cat.cashSales;
    grandTotal.afterFee += afterFee;
    grandTotal.publisherShare += partnerShare;
    grandTotal.gmShare += gmShare;
  });

  results.sort((a, b) => b.totalSales - a.totalSales);
  settlementResults = results;
  renderSettlementResults(results, grandTotal);
  saveSettlementHistory(settleMonth, results, grandTotal);
}

// ---- 결과 렌더링 ----
function renderSettlementResults(results, grandTotal) {
  document.getElementById('settle-total-sales').textContent = formatMoney(grandTotal.totalSales);
  document.getElementById('settle-card-sales').textContent = formatMoney(grandTotal.cardSales);
  document.getElementById('settle-cash-sales').textContent = formatMoney(grandTotal.cashSales);
  document.getElementById('settle-publisher-count').textContent = results.length + '건';

  const tbody = document.getElementById('settle-result-table');
  tbody.innerHTML = results.map(r => `
    <tr>
      <td style="font-weight:600;">${r.name}</td>
      <td>${formatMoney(r.totalSales)}</td>
      <td>${formatMoney(r.netAmount)}</td>
      <td>${formatMoney(r.cardSales)}</td>
      <td>${formatMoney(r.cashSales)}</td>
      <td>${formatMoney(r.afterFee)}</td>
      <td style="color:var(--blue); font-weight:700;">${formatMoney(r.publisherShare)}</td>
      <td style="color:var(--primary); font-weight:700;">${formatMoney(r.gmShare)}</td>
      <td><span class="badge badge-approved">${Math.round(r.rate * 100)}%</span></td>
      <td><button class="btn btn-sm btn-secondary" onclick="downloadSettlement('${r.name}')">다운로드</button></td>
    </tr>
  `).join('');

  document.getElementById('settle-foot-total').textContent = formatMoney(grandTotal.totalSales);
  document.getElementById('settle-foot-net').textContent = formatMoney(grandTotal.netSales);
  document.getElementById('settle-foot-card').textContent = formatMoney(grandTotal.cardSales);
  document.getElementById('settle-foot-cash').textContent = formatMoney(grandTotal.cashSales);
  document.getElementById('settle-foot-after').textContent = formatMoney(grandTotal.afterFee);
  document.getElementById('settle-foot-publisher').textContent = formatMoney(grandTotal.publisherShare);
  document.getElementById('settle-foot-gm').textContent = formatMoney(grandTotal.gmShare);

  document.getElementById('settle-step3').style.display = 'block';
  document.getElementById('settle-step3').scrollIntoView({ behavior: 'smooth' });
  showToast(results.length + '건 정산 완료!', 'success');
}

// ---- 금액 포맷 ----
function formatMoney(num) {
  if (!num && num !== 0) return '-';
  return '₩' + num.toLocaleString('ko-KR');
}

// ---- 개별 정산서 다운로드 ----
function downloadSettlement(name) {
  const result = settlementResults.find(r => r.name === name);
  if (!result) return;

  const wb = XLSX.utils.book_new();
  const monthStr = result.month ? result.month.replace('-', '년 ') + '월' : '';

  const summary = [
    [monthStr + ' 공연 수익 정산서'],
    [],
    ['운영사', '', '버치사운드'],
    [],
    ['총 매출', '', result.totalSales],
    ['순 매출 (부가세 제외)', '', result.netAmount],
    ['수수료 차감 후', '', result.afterFee],
    ['파트너 몫', '', result.publisherShare],
    ['버치사운드 몫', '', result.gmShare],
    [],
    ['세금계산서 공급가액', '', result.publisherShare],
    ['부가세', '', result.taxAmount],
    ['합계금액', '', result.totalPayable],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(summary);
  ws1['!cols'] = [{ wch: 24 }, { wch: 4 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws1, '정산요약');

  const detailHeader = ['구분', '항목', '수량', '총매출', '순매출'];
  const detailRows = result.items.map(item => [
    result.name, item.name, item.qty, item.totalSales, item.netSales
  ]);
  detailRows.push(['합 계', '', result.qty, result.totalSales, result.netSales]);

  const ws2 = XLSX.utils.aoa_to_sheet([detailHeader, ...detailRows]);
  ws2['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 8 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, '상세');

  const fileName = `${result.name}_${monthStr}_정산서.xlsx`;
  XLSX.writeFile(wb, fileName);
  showToast(fileName + ' 다운로드 완료', 'success');
}

// ---- 전체 정산서 일괄 다운로드 ----
function downloadAllSettlements() {
  if (!settlementResults || settlementResults.length === 0) {
    showToast('정산 결과가 없습니다.', 'error');
    return;
  }
  settlementResults.forEach(result => {
    setTimeout(() => downloadSettlement(result.name), 300);
  });
}

// ---- 탭 전환 ----
function switchSettleTab(tab) {
  const tabs = ['publisher', 'urban', 'popup', 'overseas'];
  tabs.forEach(t => {
    const el = document.getElementById('settle-tab-' + t);
    const btn = document.getElementById('settle-tab-btn-' + t);
    if (el) el.style.display = (t === tab) ? 'block' : 'none';
    if (btn) {
      btn.style.borderBottomColor = (t === tab) ? 'var(--primary)' : 'transparent';
      btn.style.color = (t === tab) ? 'var(--primary)' : 'var(--gray-500)';
    }
  });
}

// ---- 정산 이력 저장 ----
function saveSettlementHistory(month, results, grandTotal) {
  if (!month) return;
  try {
    const history = JSON.parse(localStorage.getItem('bs_settlement_history') || '{}');
    history[month] = {
      totalSales: grandTotal.totalSales,
      gmShare: grandTotal.gmShare,
      publisherShare: grandTotal.publisherShare,
      count: results.length,
      date: new Date().toISOString()
    };
    localStorage.setItem('bs_settlement_history', JSON.stringify(history));
  } catch (e) {
    console.error('Settlement history save error:', e);
  }
}

// Stub functions for removed features (prevent errors)
function calculateUrbanSettlement() {}
function loadStoreSalesFromSettlement() {}
function loadHRLaborCost() {}
function handleGachaUpload() {}
function loadPopupSettlement() {}
function calculatePopupSettlement() {}
function downloadPopupSettlement() {}
function downloadUrbanSettlement() {}
function saveUrbanHistory() {}
