// kuzi.js

// 組み合わせ(nCr)を計算する関数 (Javaの combination メソッドの移植)
// 計算結果が大きくなるため、JavaScriptのBigIntを使用します
function combination(n, r) {
    if (r < 0 || r > n) return 0n;
    if (r === 0 || r === n) return 1n;

    r = Math.min(r, n - r);
    let result = 1n;
    let nBig = BigInt(n);
    let rBig = BigInt(r);

    for (let i = 1n; i <= rBig; i++) {
        result = (result * (nBig - i + 1n)) / i;
    }
    return result;
}

// 確率を計算して画面に表示する関数
function calculateProbabilities() {
    // 入力値の取得
    const total = parseInt(document.getElementById('total').value, 10);
    const atari = parseInt(document.getElementById('atari').value, 10);
    const buy = parseInt(document.getElementById('buy').value, 10);
    const errorDiv = document.getElementById('error-message');
    const resultDiv = document.getElementById('result-area');

    // 初期化
    errorDiv.textContent = "";
    resultDiv.style.display = 'none';

    // 入力検証 (Java側のロジック移植)
    if (isNaN(total) || isNaN(atari) || isNaN(buy)) {
        errorDiv.textContent = "数値を入力してください。";
        return;
    }
    if (total <= 0) {
        errorDiv.textContent = "「残りくじ総数」は1以上でなければなりません。";
        return;
    }
    if (atari < 0 || buy < 0) {
        errorDiv.textContent = "「当たり枚数」と「購入数」は0以上の整数を指定してください。";
        return;
    }
    if (atari > total) {
        errorDiv.textContent = "「当たり枚数」は「残りくじ総数」以下である必要があります。";
        return;
    }
    if (buy > total) {
        errorDiv.textContent = "「購入数」は「残りくじ総数」以下である必要があります。";
        return;
    }

    try {
        // 計算処理
        const combTotal = combination(total, buy);
        
        // pA = 1 - C(total - atari, buy) / C(total, buy)
        const combFail = combination(total - atari, buy);
        
        // BigIntでの計算は整数になってしまうため、精度を出すために 10^20 倍してから計算します(JavaのSCALE=20相当)
        const scale = 100000000000000000000n; // 10^20
        
        let pAFraction = scale; // 1.0相当
        if (combFail > 0n) {
            // (combFail * scale) / combTotal を引く
            const failRatio = (combFail * scale) / combTotal;
            pAFraction = scale - failRatio;
        }
        
        // %表示のために100を掛ける(scaleが10^20なので、10^18で割れば数値になる)
        // JavaScript標準のNumberに変換して扱いやすくする
        const pAPercent = Number(pAFraction) / 1000000000000000000;

        // n枚当たる確率の計算
        const probs = {};
        const maxN = Math.min(buy, atari);

        for (let n = 0; n <= maxN; n++) {
            const comb1 = combination(atari, n);
            const comb2 = combination(total - atari, buy - n);
            const numerator = comb1 * comb2;

            // (numerator * scale * 100) / combTotal
            const probScaled = (numerator * scale * 100n) / combTotal;
            const prob = Number(probScaled) / 100000000000000000000;
            
            probs[n] = prob;
        }

        // 画面への描画
        renderResults(pAPercent, total, atari, buy, probs);

    } catch (ex) {
        errorDiv.textContent = "予期せぬエラーが発生しました。入力値が大きすぎる可能性があります。";
        console.error(ex);
    }
}

// 画面に計算結果を出力する関数
function renderResults(pA, total, atari, buy, probs) {
    document.getElementById('res-pa').textContent = formatDecimal(pA, 2);
    document.getElementById('res-total').textContent = total;
    document.getElementById('res-atari').textContent = atari;
    document.getElementById('res-buy').textContent = buy;

    const tbody = document.getElementById('res-tbody');
    tbody.innerHTML = ''; // テーブルをクリア

    for (const n in probs) {
        const tr = document.createElement('tr');
        
        const tdN = document.createElement('td');
        tdN.textContent = n;
        
        const tdProb = document.createElement('td');
        // rawデータを属性に保持（桁数変更ボタン用）
        tdProb.setAttribute('data-raw', probs[n]); 
        tdProb.textContent = formatDecimal(probs[n], 2) + '%';
        
        tr.appendChild(tdN);
        tr.appendChild(tdProb);
        tbody.appendChild(tr);
    }

    // 結果エリアを表示
    document.getElementById('result-area').style.display = 'block';
}

// 小数点以下の桁数をフォーマットする関数
function formatDecimal(value, digits) {
    // 0.00などの無駄な0を省きつつ、指定桁数で丸める処理
    const factor = Math.pow(10, digits);
    const rounded = Math.round(value * factor) / factor;
    return rounded;
}

// ボタンの挙動関数群 (元の kuzi.html の script タグ内の処理)
function addAmount(amount) {
    const buyInput = document.getElementById('buy');
    const current = parseInt(buyInput.value || "0", 10);
    buyInput.value = current + amount;
}

function addReset() {
    const buyInput = document.getElementById('buy');
    buyInput.value = 0;
}

function updateDecimalPlaces(digits) {
    const rows = document.querySelectorAll("#res-tbody tr");
    rows.forEach(row => {
        const cell = row.cells[1];
        const rawValue = parseFloat(cell.getAttribute("data-raw"));
        if (!isNaN(rawValue)) {
            // toFixedを使って強制的に桁数を合わせ、その後に余分な0を取り除く
            cell.textContent = Number(rawValue.toFixed(digits)) + '%';
        }
    });
}