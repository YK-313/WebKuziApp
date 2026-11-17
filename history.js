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
            // 合言葉が正解なら、次から打たなくていいように保存
            localStorage.setItem('kuzi_secret', secret);
            
            authSection.style.display = 'none'; // 認証枠を隠す
            mainContent.style.display = 'block'; // メイン画面を出す
            renderHistory(json.data);
        } else {
            alert(json.message); // 「合言葉が違います」等
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
        // アプリ側で面白指標（引きの強さなど）を計算して表示する仕組み
        const div = document.createElement('div');
        div.className = "history-item";
        div.innerHTML = `
            <div class="date">${data['日時']} ｜ 👤 ${data['名前']}</div>
            <div class="title">🎁 ${data['引いたくじの名前']}</div>
            <div class="detail">
                残り ${data['引く前の総数']}枚 (当たり ${data['引く前の当たり数']}枚) から<br>
                <strong>${data['引いた回数']}回</strong> 引いて <strong>${data['当たった数']}個</strong> 当選！
            </div>
        `;
        historyList.appendChild(div);
    });
    document.getElementById('login-btn').innerText = "戦歴を見る";
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

    if(!name || !kuziName || !total || !winBefore || !draws || !winAfter) {
        return alert("すべての項目を入力してください");
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
        // POSTリクエストで書き込み（CORS回避のためtext/plainを使用）
        const res = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();

        if(json.status === "success") {
            alert("戦歴を記録しました！");
            // 入力欄を空にする
            document.getElementById('input-draws').value = "";
            document.getElementById('input-winAfter').value = "";
            // リストを再読み込み
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