'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // DOM 参照
  const dateSelect = document.getElementById('date-selector');
  const tbody = document.getElementById('student-table');
  const menuBtn = document.getElementById('menu-toggle');
  const menuPanel = document.getElementById('menu-panel');
  const menuIcon = menuBtn?.querySelector('.material-symbols-outlined');
  const resetBtn = document.getElementById('reset-data');

  if (!dateSelect || !tbody || !menuBtn || !menuPanel || !menuIcon) {
    console.error('要素が取得できていません', { dateSelect, tbody, menuBtn, menuPanel, menuIcon });
    return;
  }

  // ストレージキー
  const recordsKey = 'attendanceRecords';   // 日付ごとの出欠データ
  const testsKey   = 'testRecords';         // 生徒ごとの小テスト点

  // 永続データ
  const records = JSON.parse(localStorage.getItem(recordsKey) || '{}');
  const testRecords = JSON.parse(localStorage.getItem(testsKey) || '{}');

  // 生徒名簿（例）
  const students = [
    'あんぱんまん','いしだかずき','おきたそうごう','かつらこたろう','かぐら',
    'こんどういさお','さかたぎんとき','さかもとりょうま','しむらしんぱち','たかすぎしんすけ',
    'ちちゅうたろう','なりたりょう','にいじまゆう','ねこひろし','のだなつみ',
    'はたおうじ','はんだごて','まつだいらかたくりこ','まつだいらかたくりこ','やぎゅうきゅうべい'
  ];
  students.sort((a,b)=>a.localeCompare(b,'ja'));

  let currentDate = dateSelect.value;

  function saveRecords() {
    localStorage.setItem(recordsKey, JSON.stringify(records));
  }
  function saveTestRecords() {
    localStorage.setItem(testsKey, JSON.stringify(testRecords));
  }

  function generateBlankedData() {
    const data = {};
    students.forEach(name => {
      data[name] = { attendance: '出席', skills: '', listening: '', speaking: '' };
    });
    return data;
  }

  function saveCurrentTableData() {
    records[currentDate] = records[currentDate] || {};
    tbody.querySelectorAll('tr[data-name]').forEach(row => {
      const name = row.dataset.name;
      const [attSel, sklSel, lisSel, spkSel] = row.querySelectorAll('select');
      records[currentDate][name] = {
        attendance: attSel.value,
        skills: sklSel.value,
        listening: lisSel.value,
        speaking: spkSel.value
      };
    });
    saveRecords();
  }

  function renderTableForDate(date) {
    tbody.innerHTML = '';
    currentDate = date;
    const dailyData = records[date] || generateBlankedData();

    students.forEach(name => {
      const s = dailyData[name] || { attendance: '出席', skills: '', listening: '', speaking: '' };
      tbody.insertAdjacentHTML('beforeend', `
        <tr data-name="${name}">
          <td>${name}</td>
          <td>
            <select>
              <option ${s.attendance==='出席'?'selected':''}>出席</option>
              <option ${s.attendance==='欠席'?'selected':''}>欠席</option>
              <option ${s.attendance==='遅刻'?'selected':''}>遅刻</option>
              <option ${s.attendance==='公欠'?'selected':''}>公欠</option>
            </select>
          </td>
          <td>
            <select>
              <option value="" ${s.skills===''?'selected':''}></option>
              <option value="A" ${s.skills==='A'?'selected':''}>A</option>
              <option value="B" ${s.skills==='B'?'selected':''}>B</option>
              <option value="C" ${s.skills==='C'?'selected':''}>C</option>
            </select>
          </td>
          <td>
            <select>
              <option value="" ${s.listening===''?'selected':''}></option>
              <option value="A" ${s.listening==='A'?'selected':''}>A</option>
              <option value="B" ${s.listening==='B'?'selected':''}>B</option>
              <option value="C" ${s.listening==='C'?'selected':''}>C</option>
            </select>
          </td>
          <td>
            <select>
              <option value="" ${s.speaking===''?'selected':''}></option>
              <option value="A" ${s.speaking==='A'?'selected':''}>A</option>
              <option value="B" ${s.speaking==='B'?'selected':''}>B</option>
              <option value="C" ${s.speaking==='C'?'selected':''}>C</option>
            </select>
          </td>
        </tr>
      `);
    });

    // 変更時に保存（必要に応じて出席率再描画）
    tbody.querySelectorAll('select').forEach(sel => sel.addEventListener('change', () => {
      saveCurrentTableData();
      if (document.getElementById('rate-view')?.classList.contains('active')) {
        updateAttendanceRateTable();
      }
    }));
  }

  // function updateAttendanceRateTable() {
  //   const table = document.getElementById('attendance-rate-table');
  //   if (!table) return;
  //   const body = table.querySelector('tbody');
  //   body.innerHTML = '';
  //   students.forEach(name => {
  //     let total=0, present=0, absent=0;
  //     Object.keys(records).forEach(date => {
  //       const rec = records[date]?.[name];
  //       if (!rec || !rec.attendance) return;
  //       total++;
  //       if (rec.attendance==='出席') present++; else if (rec.attendance==='欠席') absent++;
       
  //     });

  function updateAttendanceRateTable() {
  const table = document.getElementById('attendance-rate-table');
  if (!table) return;
  const body = table.querySelector('tbody');
  body.innerHTML = '';

  students.forEach(name => {
    let total = 0, present = 0, absent = 0, late = 0, officialLeave = 0;

    Object.keys(records).forEach(date => {
      const rec = records[date]?.[name];
      if (!rec || !rec.attendance) return;

      // 出席種別ごとのカウント
      if (rec.attendance === '出席') {
        total++;
        present++;
      } else if (rec.attendance === '欠席') {
        total++;
        absent++;
      } else if (rec.attendance === '公欠') {
        officialLeave++; // 参考用にカウントのみ
      }
    });

    // 公欠は出席換算（率に含める）
    present += officialLeave;
    total += officialLeave;

    // 遅刻は回数のみカウント（率には含めない）
    Object.keys(records).forEach(date => {
      const rec2 = records[date]?.[name];
      if (rec2?.attendance === '遅刻') late++;
    });

      const rate = total ? Math.round((present/total)*100) : 0;
      body.insertAdjacentHTML('beforeend', `
        <tr>
          <td>${name}</td>
          <td>${rate}%</td>
          <td>${present}</td>
          <td>${absent}</td>
          <td>${late}</td>
          <td>${officialLeave}</td>
          <td>${total}</td>
        </tr>
      `);
    });
  }

  function renderTestTable() {
    const table = document.getElementById('test-scores-table');
    if (!table) return;
    const body = table.querySelector('tbody');
    body.innerHTML = '';

    const clampScore = (v) => {
      if (v === '' || v === null || Number.isNaN(Number(v))) return '';
      const n = Math.max(0, Math.min(100, Math.floor(Number(v))));
      return n;
    };
    const avg = (arr) => {
      const nums = arr.filter(v => v !== '' && v !== null && !Number.isNaN(Number(v))).map(Number);
      if (!nums.length) return '-';
      const s = nums.reduce((a,b)=>a+b,0);
      return (s / nums.length).toFixed(1);
    };

    students.forEach(name => {
      const scores = Array.isArray(testRecords[name]) ? testRecords[name].slice(0,5) : ['', '', '', '', ''];
      while (scores.length < 5) scores.push('');
      const rowId = `row-${btoa(unescape(encodeURIComponent(name)))}`;
      body.insertAdjacentHTML('beforeend', `
        <tr id="${rowId}">
          <td>${name}</td>
          ${scores.map((sc,idx)=>`
            <td>
              <input type="number" min="0" max="100" step="1" value="${sc!==''?sc:''}" data-name="${name}" data-idx="${idx}" style="width:80px" />
            </td>
          `).join('')}
          <td class="avg-cell">${avg(scores)}</td>
        </tr>
      `);
    });

    body.querySelectorAll('input[type="number"]').forEach(inp => {
      inp.addEventListener('input', () => {
        const name = inp.dataset.name;
        const idx  = Number(inp.dataset.idx);
        const val  = clampScore(inp.value);
        if (!Array.isArray(testRecords[name])) testRecords[name] = ['', '', '', '', ''];
        testRecords[name][idx] = (val === '' ? '' : Number(val));
        saveTestRecords();

        const row = inp.closest('tr');
        const values = Array.from(row.querySelectorAll('input')).map(i => {
          const v = clampScore(i.value);
          return v === '' ? '' : Number(v);
        });
        row.querySelector('.avg-cell').textContent = avg(values);
      });
    });
  }

  // メニュー開閉（ARIA対応＋外側クリックで閉じる）
  menuBtn.setAttribute('aria-haspopup', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');
  const closeMenu = () => {
    if (!menuPanel.classList.contains('hidden')) {
      menuPanel.classList.add('hidden');
      menuIcon.textContent = 'menu';
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  };
  const openMenu = () => {
    if (menuPanel.classList.contains('hidden')) {
      menuPanel.classList.remove('hidden');
      menuIcon.textContent = 'close';
      menuBtn.setAttribute('aria-expanded', 'true');
    }
  };
  menuBtn.addEventListener('click', () => {
    if (menuPanel.classList.contains('hidden')) openMenu(); else closeMenu();
  });
  document.addEventListener('click', (e) => {
    if (menuPanel.classList.contains('hidden')) return;
    if (menuPanel.contains(e.target) || menuBtn.contains(e.target)) return;
    closeMenu();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  // メニューで画面切替
  document.querySelectorAll('.menu-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.add('hidden');
        sec.classList.remove('active');
      });
      const target = document.getElementById(targetId);
      if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
      }
      closeMenu();

      if (targetId === 'rate-view') updateAttendanceRateTable();
      if (targetId === 'test-view') renderTestTable();
    });
  });

  // データ初期化
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('保存データをすべて削除します。よろしいですか？')) {
        // 全削除
        localStorage.removeItem(recordsKey);
        localStorage.removeItem(testsKey);
        for (const k in records) delete records[k];
        for (const k in testRecords) delete testRecords[k];
        saveRecords();
        saveTestRecords();
        renderTableForDate(currentDate);
        if (document.getElementById('rate-view')?.classList.contains('active')) updateAttendanceRateTable();
        if (document.getElementById('test-view')?.classList.contains('active')) renderTestTable();
        alert('初期化しました');
      }
      closeMenu();
    });
  }

  // 初期描画
  renderTableForDate(currentDate);

  dateSelect.addEventListener('change', e => {
    saveCurrentTableData();
    currentDate = e.target.value;
    renderTableForDate(currentDate);
  });
});
