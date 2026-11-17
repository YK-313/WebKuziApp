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
        const res = await fetch(`${GAS_URL}?secret=${encodeURIComponent(secret)}`);
        const json = await res.json();

        if (json.status === "success") {
            localStorage.setItem('kuzi_secret', secret);
            authSection.style.display = 'none'; 
            mainContent.style.display = 'block'; 

            const selectKuzi = document.getElementById('select-kuzi');
            selectKuzi.innerHTML = '<option value="">▼ 過去のくじから選ぶ</option>';
            
            if (json.kuziList && json.kuziList.length > 0) {
                json.kuziList.forEach(name => {
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = name;
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
    
    // データ読み込み時に一度だけ全データを計算・加工する
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
// 確率計算（超幾何分布）用関数 (BigInt使用)
// ==========================================
function combinationsBigInt(n, r) {
    if (n < 0n || r < 0n || r > n) return 0n;
    if (r === 0n || r === n) return 1n;
    if (r > n / 2n) r = n - r;
    let c = 1n;
    for (let i = 1n; i <= r; i++) {
        c = (c * (n - i + 1n)) / i;
    }
    return c;
}

function getHypergeometricProb(N, K, n, k) {
    const N_b = BigInt(N), K_b = BigInt(K), n_b = BigInt(n), k_b = BigInt(k);
    if (k_b > K_b || (n_b - k_b) > (N_b - K_b) || k_b < 0n || n_b < 0n) return 0;
    
    const num1 = combinationsBigInt(K_b, k_b);
    const num2 = combinationsBigInt(N_b - K_b, n_b - k_b);
    const den = combinationsBigInt(N_b, n_b);
    
    const MULTIPLIER = 1000000000000000000n;
    const probBig = (num1 * num2 * MULTIPLIER) / den;
    return Number(probBig) / 1000000000000000000;
}

function getGodDrawProb(N, K, n, k) {
    let prob = 0;
    const maxK = Math.min(n, K);
    for (let x = k; x <= maxK; x++) {
        prob += getHypergeometricProb(N, K, n, x);
    }
    return prob;
}

function getBadDrawProb(N, K, n, k) {
    let prob = 0;
    const minK = Math.max(0, n - (N - K));
    for (let x = minK; x <= k; x++) {
        prob += getHypergeometricProb(N, K, n, x);
    }
    return prob;
}

function formatProb(prob) {
    const p = prob * 100;
    if (p < 0.01 && p > 0) return "< 0.01"; 
    return p.toFixed(2);
}

// ==========================================
// ランキング機能 (枠ごとに独立)
// ==========================================
let currentDataArray = [];

document.getElementById('ranking-god-type').addEventListener('change', renderGodRanking);
document.getElementById('ranking-bad-type').addEventListener('change', renderBadRanking);

function updateAllRankings(dataArray) {
    // データを読み込んだタイミングで、各戦績データの確率を「事前計算」して持たせておく
    currentDataArray = dataArray.map(d => {
        if (d['引く前の総数'] !== "" && d['引く前の当たり数'] !== "" && Number(d['引いた回数']) > 0) {
            const N = Number(d['引く前の総数']);
            const K = Number(d['引く前の当たり数']);
            const n = Number(d['引いた回数']);
            const k = Number(d['当たった数']);
            
            // ▼ 追加：N(総数)が大きすぎる場合はブラウザがフリーズするため計算をスキップ ▼
            if (N > 500) {
                return { ...d, hasProb: false };
            }

            return {
                ...d,
                hasProb: true,
                godProb: getGodDrawProb(N, K, n, k),
                badProb: getBadDrawProb(N, K, n, k)
            };
        }
        return { ...d, hasProb: false };
    });

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

// 1. 神引きランキングの描画
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
        const sorted = currentDataArray
            .filter(d => d.hasProb && d.godProb < 0.999)
            .sort((a, b) => a.godProb - b.godProb);

        if(sorted.length === 0) {
            content.innerHTML = "<p style='font-size:13px; color:#666;'>該当データなし（確率計算できる記録がありません）</p>";
            return;
        }

        sorted.slice(0, 3).forEach((d, i) => {
            const rateStr = formatProb(d.godProb);
            html += `<div class="history-item" style="border-left-color: #ffc107; margin-bottom: 6px; padding: 6px 10px;">
                <div class="title" style="font-size:14px;">${getRankIcon(i)} ${d['名前']} <span style="color:#d32f2f;">(確率 ${rateStr}%)</span></div>
                <div class="detail" style="font-size:12px; margin-top:2px;">
                    残り${d['引く前の総数']}枚(当${d['引く前の当たり数']})から ${d['引いた回数']}回で ${d['当たった数']}個！<br>
                    <span style="color:#666; font-size:11px;">🎁 ${d['引いたくじの名前']}</span>
                </div>
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

// 2. 爆死ランキングの描画
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
        const sorted = currentDataArray
            .filter(d => d.hasProb && d.badProb < 0.999) 
            .sort((a, b) => a.badProb - b.badProb);

        if(sorted.length === 0) {
            content.innerHTML = "<p style='font-size:13px; color:#666;'>該当データなし（確率計算できる記録がありません）</p>";
            return;
        }

        sorted.slice(0, 3).forEach((d, i) => {
            const rateStr = formatProb(d.badProb);
            html += `<div class="history-item" style="border-left-color: #2196f3; background-color: #f4f8fc; margin-bottom: 6px; padding: 6px 10px;">
                <div class="title" style="font-size:14px;">${getRankIcon(i)} ${d['名前']} <span style="color:#1976d2;">(確率 ${rateStr}%)</span></div>
                <div class="detail" style="font-size:12px; margin-top:2px;">
                    残り${d['引く前の総数']}枚(当${d['引く前の当たり数']})から ${d['引いた回数']}回で ${d['当たった数']}個...<br>
                    <span style="color:#666; font-size:11px;">🎁 ${d['引いたくじの名前']}</span>
                </div>
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

// 3. 引きすぎ選手権の描画
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