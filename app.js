const rankingAEl = document.getElementById('rankingA');
const rankingBEl = document.getElementById('rankingB');
const summaryEl = document.getElementById('summary');
const pairsEl = document.getElementById('pairs');
const errorBox = document.getElementById('errorBox');
const coverageBadge = document.getElementById('coverageBadge');
const inversionBadge = document.getElementById('inversionBadge');
const agreementBar = document.getElementById('agreementBar');
const agreementLabel = document.getElementById('agreementLabel');

const exampleA = ['Camila', 'Bruno', 'Aline', 'Diego', 'Fernanda', 'Igor'].join(', ');
const exampleB = ['Aline', 'Camila', 'Fernanda', 'Bruno', 'Diego', 'Igor'].join(', ');

function parseRanking(text) {
  return text
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCoverage(commonCount, totalA, totalB) {
  const base = Math.max(totalA, totalB, 1);
  return `${formatPercent(commonCount / base)} de cobertura`;
}

function ensureUnique(items, label) {
  const seen = new Set();
  const duplicates = [];

  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) {
      duplicates.push(item);
    } else {
      seen.add(key);
    }
  }

  if (duplicates.length) {
    throw new Error(`${label} contém itens repetidos. Remova duplicatas para comparar rankings.`);
  }
}

function analyzeRankings(rankingA, rankingB) {
  if (!rankingA.length || !rankingB.length) {
    throw new Error('Preencha os dois rankings com pelo menos um item cada.');
  }

  ensureUnique(rankingA, 'Ranking A');
  ensureUnique(rankingB, 'Ranking B');

  const mapA = new Map(rankingA.map((item, index) => [item.toLowerCase(), { item, index }]));
  const mapB = new Map(rankingB.map((item, index) => [item.toLowerCase(), { item, index }]));

  const commonKeys = [...mapA.keys()].filter((key) => mapB.has(key));

  if (commonKeys.length < 2) {
    throw new Error('É preciso ter pelo menos 2 itens em comum para calcular inversões.');
  }

  const orderedByA = commonKeys
    .map((key) => ({ key, label: mapA.get(key).item, positionB: mapB.get(key).index, positionA: mapA.get(key).index }))
    .sort((left, right) => left.positionA - right.positionA);

  let inversions = 0;
  const foundPairs = [];

  for (let i = 0; i < orderedByA.length; i += 1) {
    for (let j = i + 1; j < orderedByA.length; j += 1) {
      const left = orderedByA[i];
      const right = orderedByA[j];

      if (left.positionB > right.positionB) {
        inversions += 1;
        foundPairs.push({ left: left.label, right: right.label });
      }
    }
  }

  const totalPairs = (orderedByA.length * (orderedByA.length - 1)) / 2;
  const agreement = totalPairs === 0 ? 1 : 1 - (inversions / totalPairs);
  const ignoredA = rankingA.length - orderedByA.length;
  const ignoredB = rankingB.length - orderedByA.length;

  return {
    commonCount: orderedByA.length,
    totalPairs,
    inversions,
    agreement,
    disagreement: 1 - agreement,
    ignoredA,
    ignoredB,
    ignoredTotal: ignoredA + ignoredB,
    foundPairs,
  };
}

function renderSummary(result) {
  const items = [
    ['Itens em comum', result.commonCount],
    ['Pares possíveis', result.totalPairs],
    ['Inversões', result.inversions],
    ['Acordo', formatPercent(result.agreement)],
  ];

  summaryEl.innerHTML = items
    .map(([label, value]) => `
      <div class="metric">
        <span class="k">${label}</span>
        <span class="v">${value}</span>
      </div>
    `)
    .join('');
}

function renderPairs(result) {
  if (!result.foundPairs.length) {
    pairsEl.innerHTML = '<div class="empty">Nenhuma inversão encontrada. Os rankings estão na mesma ordem para os itens em comum.</div>';
    return;
  }

  pairsEl.innerHTML = result.foundPairs
    .map((pair) => `
      <div class="pair">
        <strong>${pair.left} <span class="bad">antes</span> ${pair.right}</strong>
        <span class="good">inversão</span>
      </div>
    `)
    .join('');
}

function setError(message) {
  errorBox.textContent = message;
  errorBox.style.display = message ? 'block' : 'none';
}

function analyzeAndRender() {
  try {
    setError('');
    const rankingA = parseRanking(rankingAEl.value);
    const rankingB = parseRanking(rankingBEl.value);
    const result = analyzeRankings(rankingA, rankingB);

    renderSummary(result);
    renderPairs(result);

    coverageBadge.textContent = formatCoverage(result.commonCount, rankingA.length, rankingB.length);
    inversionBadge.textContent = `${result.inversions} par${result.inversions === 1 ? '' : 'es'}`;
    agreementBar.style.width = `${result.disagreement * 100}%`;
    agreementLabel.textContent = formatPercent(result.disagreement);

    if (result.ignoredTotal > 0) {
      setError(`Itens ignorados por não estarem nos dois rankings: ${result.ignoredA} em A e ${result.ignoredB} em B.`);
    }
  } catch (error) {
    summaryEl.innerHTML = '';
    pairsEl.innerHTML = '<div class="empty">Aguardando uma comparação válida.</div>';
    coverageBadge.textContent = 'Pronto para análise';
    inversionBadge.textContent = '0 pares';
    agreementBar.style.width = '0%';
    agreementLabel.textContent = '0%';
    setError(error.message);
  }
}

document.getElementById('fillExample').addEventListener('click', () => {
  rankingAEl.value = exampleA;
  rankingBEl.value = exampleB;
  analyzeAndRender();
});

document.getElementById('swapLists').addEventListener('click', () => {
  const temp = rankingAEl.value;
  rankingAEl.value = rankingBEl.value;
  rankingBEl.value = temp;
  analyzeAndRender();
});

document.getElementById('analyze').addEventListener('click', analyzeAndRender);

rankingAEl.value = exampleA;
rankingBEl.value = exampleB;
analyzeAndRender();