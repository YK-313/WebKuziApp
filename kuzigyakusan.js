// kuzigyakusan.js

// 組み合わせ(nCr)を計算する関数 (kuzi.jsと同じBigInt処理)
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

// グラフのインスタンスを保持する変数（再描画時に古いグラフを破棄するため）
let myChart = null;

// 計算と描画のメイン処理
function calculateGyakusan() {
    const total = parseInt(document.getElementById('gyaku-total').value, 10);
    const atari = parseInt(document.getElementById('gyaku-atari').value, 10);
    const digits = parseInt(document.getElementById('gyaku-digits').value, 10);
    const errorDiv = document.getElementById('error-message');
    const resultDiv = document.getElementById('result-area');

    // 初期化
    errorDiv.textContent = "";
    resultDiv.style.display = 'none';

    // 入力検証
    if (isNaN(total) || isNaN(atari) || isNaN(digits)) {
        errorDiv.textContent = "数値を入力してください。";
        return;
    }
    if (total <= 0) {
        errorDiv.textContent = "「残りくじ総数」は1以上でなければなりません。";
        return;
    }
    if (atari > total) {
        errorDiv.textContent = "「当たり枚数」は「残りくじ総数」以下である必要があります。";
        return;
    }

    try {
        const scale = 100000000000000000000n; // 精度を保つための10^20
        let threshold = 10;
        
        const keyProbs = [];
        const allProbs = [];
        const chartLabels = [];
        const chartData = [];

        // 1枚からtotal枚までループして確率を計算
        for (let k = 1; k <= total; k++) {
            const combTotal = combination(total, k);
            const combFail = combination(total - atari, k);
            
            let probDown = 0;
            if (combTotal > 0n) {
                const failRatio = (combFail * scale) / combTotal;
                const pFraction = scale - failRatio;
                // %変換のために100を掛けたいので、10^20ではなく10^18で割る
                const prob = Number(pFraction) / 1000000000000000000;
                
                // 切り捨て処理 (Javaの RoundingMode.DOWN 相当)
                const factor = Math.pow(10, digits);
                probDown = Math.floor(prob * factor) / factor;
            }

            chartLabels.push(k);
            chartData.push(probDown);
            allProbs.push({ k: k, prob: probDown });

            // キリ番（10%, 20%...）を超えた記録を保存
            if (probDown >= threshold) {
                keyProbs.push({ k: k, prob: probDown });
                threshold += 10;
            }
        }

        // 画面のテーブルとグラフを更新
        renderTables(keyProbs, allProbs, digits);
        renderChart(chartLabels, chartData);

        resultDiv.style.display = 'block';

    } catch (ex) {
        errorDiv.textContent = "予期せぬエラーが発生しました。";
        console.error(ex);
    }
}

// テーブルにデータを挿入する関数
function renderTables(keyProbs, allProbs, digits) {
    // 主要な期待値テーブルの描画
    const keyTbody = document.getElementById('key-probs-tbody');
    keyTbody.innerHTML = '';
    keyProbs.forEach(data => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${data.k}枚</td><td>${data.prob.toFixed(digits)}%</td>`;
        keyTbody.appendChild(tr);
    });

    // 詳細な確率テーブルの描画
    const allTbody = document.getElementById('all-probs-tbody');
    allTbody.innerHTML = '';
    allProbs.forEach(data => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${data.k}枚</td><td>${data.prob.toFixed(digits)}%</td>`;
        allTbody.appendChild(tr);
    });
}

// Chart.jsを使ってグラフを描画する関数
function renderChart(labels, data) {
    const ctx = document.getElementById('gyakuChart').getContext('2d');

    // 既にグラフが存在する場合は破棄（キャンバスが重なってバグるのを防ぐため）
    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "あたりが一つ以上出る確率",
                data: data,
                borderColor: "rgb(75, 192, 192)",
                tension: 0.1,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: '#000000', font: { size: 20 } }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'あたりが一つ以上出る確率 (%)',
                        color: '#000000',
                        font: { size: 20 }
                    },
                    beginAtZero: true,
                    max: 100,
                    ticks: { stepSize: 10 },
                },
                x: {
                    title: {
                        display: true,
                        text: '購入枚数',
                        color: '#000000',
                        font: { size: 20 }
                    },
                },
            },
        },
    });
}