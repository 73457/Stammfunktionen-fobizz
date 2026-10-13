"use strict";

// Kleine Hilfsfunktionen für Zufallszahlen und Auswahl.
function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSign() {
  return Math.random() < 0.5 ? -1 : 1;
}

function shuffle(items) {
  return items
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => entry.item);
}

const setup = document.querySelector("#setup");
const activity = document.querySelector("#activity");
const functionList = document.querySelector("#function-list");
const graphList = document.querySelector("#graph-list");
const results = document.querySelector("#results");
const resultSummary = document.querySelector("#result-summary");
const resultDetails = document.querySelector("#result-details");

let currentRound = null;

document.querySelector("#start-button").addEventListener("click", startRound);
document.querySelector("#new-round-button").addEventListener("click", showSetup);
document.querySelector("#check-button").addEventListener("click", evaluateRound);
window.addEventListener("resize", redrawAllGraphs);

function startRound() {
  const level = document.querySelector('input[name="level"]:checked').value;
  const includeDecoys = document.querySelector("#include-decoys").checked;

  currentRound = createRound(level, includeDecoys);
  setup.classList.add("hidden");
  activity.classList.remove("hidden");

  document.querySelector("#round-info").textContent =
    level === "easy"
      ? "Level 1 · Einstieg"
      : "Level 2 · Kniffliger";

  renderRound();
}

function showSetup() {
  activity.classList.add("hidden");
  setup.classList.remove("hidden");
  currentRound = null;
}

function createRound(level, includeDecoys) {
  const functions = [];
  const functionCount = 3;

  for (let index = 0; index < functionCount; index += 1) {
    functions.push({
      id: `f${index + 1}`,
      terms: createFunctionTerms(level)
    });
  }

  const graphs = [];

  // Zu jeder Funktionsgleichung gibt es genau zwei richtige Graphen:
  // Die beiden Stammfunktionen unterscheiden sich nur durch eine Konstante.
  for (const fn of functions) {
    for (const constant of [-2, 2]) {
      graphs.push({
        id: `g${graphs.length + 1}`,
        terms: integrateTerms(fn.terms),
        constant,
        correctFunctionId: fn.id,
        isDecoy: false
      });
    }
  }

  if (includeDecoys) {
    const decoyCount = 2;

    for (let index = 0; index < decoyCount; index += 1) {
      const sourceFunction = randomItem(functions);
      const wrongTerms = makeWrongPrimitive(sourceFunction.terms);

      graphs.push({
        id: `g${graphs.length + 1}`,
        terms: wrongTerms,
        constant: randomInt(-2, 2),
        correctFunctionId: null,
        isDecoy: true
      });
    }
  }

  return {
    level,
    includeDecoys,
    functions,
    graphs: shuffle(graphs)
  };
}

function createFunctionTerms(level) {
  if (level === "easy") {
    const firstDegree = randomInt(1, 2);
    const secondDegree = firstDegree === 1 ? 2 : 1;

    return [
      { kind: "power", a: randomInt(1, 3) * randomSign(), n: firstDegree },
      { kind: "power", a: randomInt(1, 3) * randomSign(), n: secondDegree },
      { kind: "power", a: randomInt(1, 3) * randomSign(), n: 0 }
    ];
  }

  const terms = [
    { kind: "power", a: randomInt(1, 3) * randomSign(), n: randomInt(1, 3) },
    { kind: "power", a: randomInt(1, 3) * randomSign(), n: randomInt(0, 2) }
  ];

  const extraKind = randomItem(["power", "exp", "sin", "cos"]);

  if (extraKind === "power") {
    terms.push({
      kind: "power",
      a: randomInt(1, 2) * randomSign(),
      n: randomInt(1, 3)
    });
  } else if (extraKind === "exp") {
    terms.push({
      kind: "exp",
      a: randomInt(1, 2) * randomSign(),
      k: randomItem([-2, -1, 1, 2])
    });
  } else {
    terms.push({
      kind: extraKind,
      a: randomInt(1, 2) * randomSign(),
      k: randomItem([1, 2])
    });
  }

  return terms;
}

function integrateTerms(terms) {
  return terms.map((term) => {
    if (term.kind === "power") {
      return {
        kind: "power",
        a: term.a / (term.n + 1),
        n: term.n + 1
      };
    }

    if (term.kind === "exp") {
      return {
        kind: "exp",
        a: term.a / term.k,
        k: term.k
      };
    }

    if (term.kind === "sin") {
      return {
        kind: "cos",
        a: -term.a / term.k,
        k: term.k
      };
    }

    return {
      kind: "sin",
      a: term.a / term.k,
      k: term.k
    };
  });
}

function makeWrongPrimitive(terms) {
  const wrongTerms = integrateTerms(terms).map((term) => ({ ...term }));
  const index = randomInt(0, wrongTerms.length - 1);

  // Mindestens ein Vorzeichen wird verändert, damit der Graph nicht passt.
  wrongTerms[index].a *= -1;
  return wrongTerms;
}

function renderRound() {
  renderFunctions();
  renderGraphs();

  document.querySelector("#graph-count").textContent =
    `${currentRound.graphs.length} Graphen`;

  results.classList.add("hidden");
  resultDetails.replaceChildren();
  resultSummary.textContent = "";
}

function renderFunctions() {
  functionList.replaceChildren();

  currentRound.functions.forEach((fn, index) => {
    const card = document.createElement("article");
    card.className = "function-card";

    const badge = document.createElement("span");
    badge.className = "function-badge";
    badge.textContent = String.fromCharCode(65 + index);

    const equation = document.createElement("span");
    equation.className = "math-expression";
    equation.innerHTML = `f<sub>${index + 1}</sub>(x) = ${formatTerms(fn.terms)}`;

    card.append(badge, equation);
    functionList.append(card);
  });
}

function renderGraphs() {
  graphList.replaceChildren();

  currentRound.graphs.forEach((graph, index) => {
    const card = document.createElement("article");
    card.className = "graph-card";
    card.dataset.graphId = graph.id;

    const heading = document.createElement("div");
    heading.className = "graph-card-header";

    const badge = document.createElement("span");
    badge.className = "graph-badge";
    badge.textContent = String.fromCharCode(65 + index);

    const label = document.createElement("strong");
    label.textContent = `Graph ${String.fromCharCode(65 + index)}`;
    heading.append(badge, label);

    const canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      `Koordinatensystem mit dem Graphen ${String.fromCharCode(65 + index)}`
    );

    const select = document.createElement("select");
    select.setAttribute(
      "aria-label",
      `Funktionsgleichung für Graph ${String.fromCharCode(65 + index)}`
    );

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = currentRound.includeDecoys
      ? "Nicht zuordnen"
      : "Funktionsgleichung auswählen";
    select.append(emptyOption);

    currentRound.functions.forEach((fn, functionIndex) => {
      const option = document.createElement("option");
      option.value = fn.id;
      option.textContent = `Funktion ${String.fromCharCode(65 + functionIndex)}`;
      select.append(option);
    });

    const feedback = document.createElement("p");
    feedback.className = "graph-feedback";
    feedback.setAttribute("aria-live", "polite");

    card.append(heading, canvas, select, feedback);
    graphList.append(card);
  });

  redrawAllGraphs();
}

function redrawAllGraphs() {
  if (!currentRound) return;

  currentRound.graphs.forEach((graph) => {
    const card = graphList.querySelector(`[data-graph-id="${graph.id}"]`);
    const canvas = card?.querySelector("canvas");

    if (canvas) drawGraph(canvas, graph);
  });
}

function drawGraph(canvas, graph) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width) return;

  const dpr = window.devicePixelRatio || 1;
  const width = rect.width;
  const height = rect.height;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  const context = canvas.getContext("2d");
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  const margin = { left: 34, right: 12, top: 12, bottom: 25 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const xMin = -2.5;
  const xMax = 2.5;
  const samples = [];

  for (let index = 0; index <= 180; index += 1) {
    const x = xMin + ((xMax - xMin) * index) / 180;
    const y = evaluatePrimitive(graph, x);
    if (Number.isFinite(y)) samples.push(Math.abs(y));
  }

  const sortedValues = samples.sort((a, b) => a - b);
  const percentile = sortedValues[Math.floor(sortedValues.length * 0.9)] || 4;
  const yLimit = Math.max(4, Math.min(12, Math.ceil(percentile * 1.2)));

  const px = (x) => margin.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const py = (y) => margin.top + ((yLimit - y) / (2 * yLimit)) * plotHeight;

  context.font = "11px system-ui, sans-serif";
  context.lineWidth = 1;
  context.strokeStyle = "#e5eaf2";
  context.fillStyle = "#7a879a";

  for (let x = -2; x <= 2; x += 1) {
    context.beginPath();
    context.moveTo(px(x), margin.top);
    context.lineTo(px(x), margin.top + plotHeight);
    context.stroke();
    if (x !== 0) context.fillText(String(x), px(x) - 3, height - 7);
  }

  const yStep = yLimit > 7 ? 4 : 2;

  for (let y = -yLimit; y <= yLimit; y += yStep) {
    context.beginPath();
    context.moveTo(margin.left, py(y));
    context.lineTo(margin.left + plotWidth, py(y));
    context.stroke();
    if (y !== 0) context.fillText(String(y), 4, py(y) + 4);
  }

  context.strokeStyle = "#8290a5";
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(px(0), margin.top);
  context.lineTo(px(0), margin.top + plotHeight);
  context.moveTo(margin.left, py(0));
  context.lineTo(margin.left + plotWidth, py(0));
  context.stroke();

  context.strokeStyle = "#3859d8";
  context.lineWidth = 2.7;
  context.lineJoin = "round";
  context.beginPath();

  let drawing = false;

  for (let index = 0; index <= 240; index += 1) {
    const x = xMin + ((xMax - xMin) * index) / 240;
    const y = evaluatePrimitive(graph, x);

    if (!Number.isFinite(y) || Math.abs(y) > yLimit * 2) {
      drawing = false;
      continue;
    }

    if (!drawing) {
      context.moveTo(px(x), py(y));
      drawing = true;
    } else {
      context.lineTo(px(x), py(y));
    }
  }

  context.stroke();
}

function evaluatePrimitive(graph, x) {
  let total = graph.constant;

  for (const term of graph.terms) {
    if (term.kind === "power") {
      total += term.a * Math.pow(x, term.n);
    } else if (term.kind === "exp") {
      total += term.a * Math.exp(term.k * x);
    } else if (term.kind === "sin") {
      total += term.a * Math.sin(term.k * x);
    } else if (term.kind === "cos") {
      total += term.a * Math.cos(term.k * x);
    }
  }

  return total;
}

function formatTerms(terms) {
  const visibleTerms = terms.filter((term) => Math.abs(term.a) > 0.0001);

  if (visibleTerms.length === 0) return "0";

  return visibleTerms.map((term, index) => {
    const negative = term.a < 0;
    const absoluteCoefficient = Math.abs(term.a);
    const body = formatTermBody(term, absoluteCoefficient);

    if (index === 0) return negative ? `−${body}` : body;
    return negative ? ` − ${body}` : ` + ${body}`;
  }).join("");
}

function formatTermBody(term, coefficient) {
  const coefficientText = formatNumber(coefficient);

  if (term.kind === "power") {
    if (term.n === 0) return coefficientText;
    const variable = term.n === 1 ? "x" : `x<sup>${term.n}</sup>`;
    return coefficient === 1 ? variable : `${coefficientText}${variable}`;
  }

  if (term.kind === "exp") {
    const exponent = term.k === 1 ? "x" : `${term.k}x`;
    const base = `e<sup>${exponent}</sup>`;
    return coefficient === 1 ? base : `${coefficientText}${base}`;
  }

  const argument = term.k === 1 ? "x" : `${term.k}x`;
  const trigFunction = term.kind === "sin" ? "sin" : "cos";
  const trigText = `${trigFunction}(${argument})`;
  return coefficient === 1 ? trigText : `${coefficientText}${trigText}`;
}

function formatNumber(value) {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded).replace(".", ",");
}

function evaluateRound() {
  const selections = new Map();
  const cards = [...graphList.querySelectorAll(".graph-card")];

  for (const card of cards) {
    const select = card.querySelector("select");

    if (!currentRound.includeDecoys && !select.value) {
      resultSummary.textContent =
        "Bitte ordne zuerst jedem Graphen eine Funktionsgleichung zu.";
      results.classList.remove("hidden");
      select.focus();
      return;
    }

    selections.set(card.dataset.graphId, select.value);
  }

  let correctlyMatched = 0;
  let correctlyLeftBlank = 0;

  for (const graph of currentRound.graphs) {
    const selectedId = selections.get(graph.id);

    if (!graph.isDecoy && selectedId === graph.correctFunctionId) {
      correctlyMatched += 1;
    } else if (graph.isDecoy && selectedId === "") {
      correctlyLeftBlank += 1;
    }
  }

  const correctCount = correctlyMatched + correctlyLeftBlank;
  const totalCount = currentRound.graphs.length;

  resultSummary.textContent =
    `${correctCount} von ${totalCount} Graphen richtig behandelt. ` +
    `${correctlyMatched} passende Stammfunktions-Graphen richtig zugeordnet.`;

  resultDetails.replaceChildren();
  const list = document.createElement("ul");
  list.className = "result-list";

  currentRound.functions.forEach((fn, index) => {
    const matchedForFunction = currentRound.graphs.filter(
      (graph) =>
        !graph.isDecoy &&
        graph.correctFunctionId === fn.id &&
        selections.get(graph.id) === fn.id
    ).length;

    const item = document.createElement("li");
    item.textContent =
      `Funktion ${String.fromCharCode(65 + index)}: ` +
      `${matchedForFunction} von 2 passenden Graphen richtig zugeordnet.`;
    list.append(item);
  });

  if (currentRound.includeDecoys) {
    const decoyCount = currentRound.graphs.filter((graph) => graph.isDecoy).length;
    const blankDecoys = currentRound.graphs.filter(
      (graph) => graph.isDecoy && selections.get(graph.id) === ""
    ).length;

    const item = document.createElement("li");
    item.textContent =
      `Falsche Graphen: ${blankDecoys} von ${decoyCount} sinnvoll nicht zugeordnet.`;
    list.append(item);
  }

  resultDetails.append(list);

  for (const graph of currentRound.graphs) {
    const card = graphList.querySelector(`[data-graph-id="${graph.id}"]`);
    const selectedId = selections.get(graph.id);
    const isCorrect = graph.isDecoy
      ? selectedId === ""
      : selectedId === graph.correctFunctionId;

    card.classList.toggle("is-correct", isCorrect);
    card.classList.toggle("is-incorrect", !isCorrect);

    const feedback = card.querySelector(".graph-feedback");
    feedback.textContent = graph.isDecoy
      ? (isCorrect ? "Richtig: Dieser Graph bleibt unzugeordnet." : "Dieser Graph gehört zu keiner Funktion.")
      : (isCorrect ? "Richtig zugeordnet." : "Noch nicht richtig zugeordnet.");
  }

  results.classList.remove("hidden");
}
