// ▼▼ ここに先ほど取得したGASのURLを貼り付けます ▼▼
const GAS_URL = "https://script.google.com/macros/s/AKfycbwexbZhCbnHoqqtgdW6VziRd_xWaMzoLqVlLTx0sijUqU3f1vLRH1aXccL-6ZQwYQePfA/exec";

const authSection = document.getElementById('auth-section');
const mainContent = document.getElementById('main-content');
const secretInput = document.getElementById('secret-key');
const historyList = document.getElementById('history-list');

// 画面を開いた時、前回入力した合言葉があれば自動入力する
window.addEventListener('DOMContentLoaded', () => {
    const savedSecret = localStorage.getItem('kuzi_secret');
    if (savedSecret) {
        secretInput.value = savedSecret;
    }
});

// 「戦歴を見る」ボタン
document.getElementById('login-btn').addEventListener('click', loadHistory);
// 「最新に更新」ボタン
document.getElementById('reload-btn').addEventListener('click', loadHistory);

// ▼ くじの名前プルダウン変更時にテキストボックスに反映させる ▼
document.getElementById('select-kuzi').addEventListener('change', (e) => {
    if (e.target.value) {
        document.getElementById('input-kuzi').value = e.target.value;
    }
});

// GASからデータを読み込む関数
async function loadHistory() {
    const secret = secretInput.value.trim();
    if (!secret) return alert("合言葉を入力してください");

    document.getElementById('login-btn').innerText = "読み込み中...";
    
    try {
        // GETリクエストで合言葉を送信
        const res = await fetch(`${GAS_URL}?secret=${encodeURIComponent(secret)}`);
        const json = await res.json();

        if (json.status === "success") {
            // 合言葉が正解なら保存
            localStorage.setItem('kuzi_secret', secret);
            authSection.style.display = 'none'; 
            mainContent.style.display = 'block'; 

            // くじの名前リストをプルダウンにセットする
            const selectKuzi = document.getElementById('select-kuzi');
            selectKuzi.innerHTML = '<option value="">▼ 過去のくじから選ぶ</option>'; // 一旦初期化
            
            if (json.kuziList && json.kuziList.length > 0) {
                json.kuziList.forEach(name => {
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = name; // selectのoptionにはtextContentが必要
                    selectKuzi.appendChild(option);
                });
            }
            renderHistory(json.data);
        } else {
            alert(json.message);
            document.getElementById('login-btn').innerText = "戦歴を見る";
        }
    } catch (e) {
        alert("通信エラーが発生しました");
        document.getElementById('login-btn').innerText = "戦歴を見る";
    }
}

// 戦歴を画面に描画する関数
function renderHistory(dataArray) {
    historyList.innerHTML = "";
    if(dataArray.length === 0) {
        historyList.innerHTML = "<p>まだ戦歴がありません。</p>";
        return;
    }

    dataArray.forEach(data => {
        const t = data['引く前の総数'] !== "" ? data['引く前の総数'] : "？";
        const w = data['引く前の当たり数'] !== "" ? data['引く前の当たり数'] : "？";

        const div = document.createElement('div');
        div.className = "history-item";
        div.innerHTML = `
            <div class="date">${data['日時']} ｜ 👤 ${data['名前']}</div>
            <div class="title">🎁 ${data['引いたくじの名前']}</div>
            <div class="detail">
                残り ${t}枚 (当たり ${w}枚) から<br>
                <strong>${data['引いた回数']}回</strong> 引いて <strong>${data['当たった数']}個</strong> 当選！
            </div>
        `;
        historyList.appendChild(div);
    });
    document.getElementById('login-btn').innerText = "戦歴を見る";
    updateAllRankings(dataArray);
}

// 「戦歴を記録する」ボタン
document.getElementById('submit-btn').addEventListener('click', async () => {
    const secret = secretInput.value.trim();
    const name = document.getElementById('input-name').value.trim();
    const kuziName = document.getElementById('input-kuzi').value.trim();
    const total = document.getElementById('input-total').value; 
    const winBefore = document.getElementById('input-winBefore').value; 
    const draws = document.getElementById('input-draws').value;
    const winAfter = document.getElementById('input-winAfter').value;

    if(!name || !kuziName || !draws || !winAfter) {
        return alert("名前、くじの名前、引いた回数、アタリの当選数は必須です");
    }

    if (Number(draws) < 0 || Number(winAfter) < 0 || (total !== "" && Number(total) < 0) || (winBefore !== "" && Number(winBefore) < 0)) {
        return alert("マイナスの値は入力できません");
    }

    const d = parseInt(draws, 10);
    const wa = parseInt(winAfter, 10);

    if (d < wa) return alert("値が正しくありません（引いた回数より、当たった数の方が多くなっています）");
    if (total !== "") {
        const t = parseInt(total, 10);
        if (t < d) return alert("値が正しくありません（引く前の総数より、引いた回数の方が多くなっています）");
    }
    if (winBefore !== "") {
        const wb = parseInt(winBefore, 10);
        if (wb < wa) return alert("値が正しくありません（引く前のアタリの数より、アタリ当選数の方が多くなっています）");
    }
    if (total !== "" && winBefore !== "") {
        const t = parseInt(total, 10);
        const wb = parseInt(winBefore, 10);
        if (t < wb) return alert("値が正しくありません（引く前の総数より、当たり数の方が多くなっています）");
    }

    const btn = document.getElementById('submit-btn');
    btn.innerText = "送信中...";
    btn.disabled = true;

    const payload = {
        secret: secret,
        name: name,
        kuziName: kuziName,
        total: total,
        winBefore: winBefore,
        draws: draws,
        winAfter: winAfter
    };

    try {
        const res = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();

        if(json.status === "success") {
            alert("戦歴を記録しました！");
            
            // ★送信完了後、プルダウンの選択をリセット（テキストボックスはそのまま）
            document.getElementById('select-kuzi').value = "";
            
            loadHistory();
        } else {
            alert(json.message);
        }
    } catch (e) {
        alert("送信に失敗しました");
    } finally {
        btn.innerText = "この戦歴を記録する";
        btn.disabled = false;
    }
});

// ==========================================
// ランキング機能 (枠ごとに独立)
// ==========================================
let currentDataArray = [];

document.getElementById('ranking-god-type').addEventListener('change', renderGodRanking);
document.getElementById('ranking-bad-type').addEventListener('change', renderBadRanking);

function updateAllRankings(dataArray) {
    currentDataArray = dataArray;
    renderGodRanking();
    renderBadRanking();
    renderDrawsRanking();
}

const getRankIcon = (index) => {
    if(index === 0) return "🥇";
    if(index === 1) return "🥈";
    if(index === 2) return "🥉";
    return `${index + 1}位`;
};

function renderGodRanking() {
    const type = document.getElementById('ranking-god-type').value;
    const content = document.getElementById('ranking-god-content');
    content.innerHTML = "";

    if (currentDataArray.length === 0) {
        content.innerHTML = "<p style='font-size:13px; color:#666;'>データがありません。</p>";
        return;
    }

    let html = "";
    if (type === 'god-record') {
        const sorted = [...currentDataArray].filter(d => Number(d['引いた回数']) > 0).sort((a, b) => {
            const rateA = Number(a['当たった数']) / Number(a['引いた回数']);
            const rateB = Number(b['当たった数']) / Number(b['引いた回数']);
            if (rateB !== rateA) return rateB - rateA; 
            return Number(b['引いた回数']) - Number(a['引いた回数']); 
        });

        sorted.slice(0, 3).forEach((d, i) => {
            const rate = ((Number(d['当たった数']) / Number(d['引いた回数'])) * 100).toFixed(1);
            html += `<div class="history-item" style="border-left-color: #ffc107; margin-bottom: 6px; padding: 6px 10px;">
                <div class="title" style="font-size:14px;">${getRankIcon(i)} ${d['名前']} <span style="color:#d32f2f;">(勝率 ${rate}%)</span></div>
                <div class="detail" style="font-size:12px; margin-top:2px;">${d['引いた回数']}回中 ${d['当たった数']}個 ｜ 🎁 ${d['引いたくじの名前']}</div>
            </div>`;
        });
    } else {
        const userStats = {};
        currentDataArray.forEach(d => {
            const name = d['名前'];
            const draws = Number(d['引いた回数']) || 0;
            const wins = Number(d['当たった数']) || 0;
            if (!userStats[name]) userStats[name] = { name: name, totalDraws: 0, totalWins: 0 };
            userStats[name].totalDraws += draws;
            userStats[name].totalWins += wins;
        });
        const sorted = Object.values(userStats).filter(u => u.totalDraws > 0).sort((a, b) => {
            const rateA = a.totalWins / a.totalDraws;
            const rateB = b.totalWins / b.totalDraws;
            if (rateB !== rateA) return rateB - rateA;
            return b.totalDraws - a.totalDraws;
        });

        sorted.slice(0, 3).forEach((u, i) => {
            const rate = ((u.totalWins / u.totalDraws) * 100).toFixed(1);
            html += `<div class="history-item" style="border-left-color: #ffc107; margin-bottom: 6px; padding: 6px 10px;">
                <div class="title" style="font-size:14px;">${getRankIcon(i)} ${u.name} <span style="color:#d32f2f;">(総合勝率 ${rate}%)</span></div>
                <div class="detail" style="font-size:12px; margin-top:2px;">累計 ${u.totalDraws}回中 ${u.totalWins}個当選</div>
            </div>`;
        });
    }
    content.innerHTML = html || "<p style='font-size:13px; color:#666;'>該当データなし</p>";
}

function renderBadRanking() {
    const type = document.getElementById('ranking-bad-type').value;
    const content = document.getElementById('ranking-bad-content');
    content.innerHTML = "";

    if (currentDataArray.length === 0) {
        content.innerHTML = "<p style='font-size:13px; color:#666;'>データがありません。</p>";
        return;
    }

    let html = "";
    if (type === 'bad-record') {
        const sorted = [...currentDataArray].filter(d => Number(d['引いた回数']) > 0).sort((a, b) => {
            const rateA = Number(a['当たった数']) / Number(a['引いた回数']);
            const rateB = Number(b['当たった数']) / Number(b['引いた回数']);
            if (rateA !== rateB) return rateA - rateB;
            return Number(b['引いた回数']) - Number(a['引いた回数']);
        });

        sorted.slice(0, 3).forEach((d, i) => {
            const rate = ((Number(d['当たった数']) / Number(d['引いた回数'])) * 100).toFixed(1);
            html += `<div class="history-item" style="border-left-color: #2196f3; background-color: #f4f8fc; margin-bottom: 6px; padding: 6px 10px;">
                <div class="title" style="font-size:14px;">${getRankIcon(i)} ${d['名前']} <span style="color:#1976d2;">(勝率 ${rate}%)</span></div>
                <div class="detail" style="font-size:12px; margin-top:2px;">${d['引いた回数']}回中 ${d['当たった数']}個 ｜ 🎁 ${d['引いたくじの名前']}</div>
            </div>`;
        });
    } else {
        const userStats = {};
        currentDataArray.forEach(d => {
            const name = d['名前'];
            const draws = Number(d['引いた回数']) || 0;
            const wins = Number(d['当たった数']) || 0;
            if (!userStats[name]) userStats[name] = { name: name, totalDraws: 0, totalWins: 0 };
            userStats[name].totalDraws += draws;
            userStats[name].totalWins += wins;
        });
        const sorted = Object.values(userStats).filter(u => u.totalDraws > 0).sort((a, b) => {
            const rateA = a.totalWins / a.totalDraws;
            const rateB = b.totalWins / b.totalDraws;
            if (rateA !== rateB) return rateA - rateB;
            return b.totalDraws - a.totalDraws;
        });

        sorted.slice(0, 3).forEach((u, i) => {
            const rate = ((u.totalWins / u.totalDraws) * 100).toFixed(1);
            html += `<div class="history-item" style="border-left-color: #2196f3; background-color: #f4f8fc; margin-bottom: 6px; padding: 6px 10px;">
                <div class="title" style="font-size:14px;">${getRankIcon(i)} ${u.name} <span style="color:#1976d2;">(総合勝率 ${rate}%)</span></div>
                <div class="detail" style="font-size:12px; margin-top:2px;">累計 ${u.totalDraws}回中 ${u.totalWins}個当選</div>
            </div>`;
        });
    }
    content.innerHTML = html || "<p style='font-size:13px; color:#666;'>該当データなし</p>";
}

function renderDrawsRanking() {
    const content = document.getElementById('ranking-draws-content');
    content.innerHTML = "";

    if (currentDataArray.length === 0) {
        content.innerHTML = "<p style='font-size:13px; color:#666;'>データがありません。</p>";
        return;
    }

    const userStats = {};
    currentDataArray.forEach(d => {
        const name = d['名前'];
        const draws = Number(d['引いた回数']) || 0;
        if (!userStats[name]) userStats[name] = { name: name, totalDraws: 0 };
        userStats[name].totalDraws += draws;
    });
    const sorted = Object.values(userStats).filter(u => u.totalDraws > 0).sort((a, b) => b.totalDraws - a.totalDraws);

    let html = "";
    sorted.slice(0, 3).forEach((u, i) => {
        html += `<div class="history-item" style="border-left-color: #4caf50; background-color: #f1f8e9; margin-bottom: 6px; padding: 6px 10px;">
            <div class="title" style="font-size:14px;">${getRankIcon(i)} ${u.name} <span style="color:#388e3c;">(総引回数 ${u.totalDraws}回)</span></div>
            <div class="detail" style="font-size:12px; margin-top:2px;">一番くじスポンサー候補</div>
        </div>`;
    });

    content.innerHTML = html || "<p style='font-size:13px; color:#666;'>該当データなし</p>";
}