/* ------------- initial data ------------- */
/* Default groups (editable in localStorage later) */
const defaultGroups = {
  "Gruppe1": { password: "1234", money: 1000, friends: 0, clothes: false, mp3: false, transactions: [] },
  "Gruppe2": { password: "abcd", money: 800, friends: 1, clothes: true, mp3: false, transactions: ["-200 Kleidung gekauft"] }
};

/* Stations (represent stores/roles) */
const stations = {
  bar: { name: "🍹 Bar", password: "bar123" },
  casino: { name: "🎰 Casino", password: "casino123" },
  reisebuero: { name: "✈️ Reisebüro", password: "reise123" },
  warenhaus: { name: "🛍️ Warenhaus", password: "shop123" },
  hotel: { name: "🏨 Hotel", password: "hotel123" },
  imbiss: { name: "🍔 Imbiss", password: "imbiss123" }
};

/* Ensure groups exist in localStorage */
function ensureGroupsInStorage() {
  Object.keys(defaultGroups).forEach(k => {
    if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(defaultGroups[k]));
  });
}
ensureGroupsInStorage();

/* ------------- GROUP LOGIN (index.html) ------------- */
function groupLogin() {
  const name = document.getElementById("groupName").value.trim();
  const pw = document.getElementById("password").value.trim();
  const error = document.getElementById("error");

  if (!name || !pw) {
    error.textContent = "Bitte Gruppenname und Passwort eingeben!";
    return;
  }

  const stored = localStorage.getItem(name);
  if (!stored) {
    error.textContent = "Gruppe nicht gefunden!";
    return;
  }
  const data = JSON.parse(stored);
  if (data.password !== pw) {
    error.textContent = "Falsches Passwort!";
    return;
  }

  // login success
  localStorage.setItem("loggedGroup", name);
  window.location.href = "dashboard.html";
}

/* convenience: demo fill for quick tests */
function prefillTest() {
  document.getElementById("groupName").value = "Gruppe1";
  document.getElementById("password").value = "1234";
}

/* ------------- DASHBOARD (dashboard.html) ------------- */
function loadDashboard() {
  const name = localStorage.getItem("loggedGroup");
  if (!name) { if (window.location.pathname.includes("dashboard.html")) window.location.href = "index.html"; return; }

  const raw = localStorage.getItem(name);
  const data = raw ? JSON.parse(raw) : defaultGroups[name];

  // update title
  const title = document.getElementById("groupTitle");
  if (title) title.textContent = name;

  // update money
  const moneyEl = document.getElementById("money");
  if (moneyEl) moneyEl.textContent = data.money;

  // update transactions dropdown
  const dropdown = document.getElementById("transactionDropdown");
  if (dropdown) {
    // clear
    dropdown.innerHTML = "";
    if (!data.transactions || data.transactions.length === 0) {
      const opt = document.createElement("option"); opt.textContent = "Keine Ausgaben bisher"; dropdown.appendChild(opt);
    } else {
      data.transactions.slice().reverse().forEach(t => { // newest first
        const opt = document.createElement("option"); opt.textContent = t; dropdown.appendChild(opt);
      });
    }
  }

  // update inventory visuals
  updateInventoryUI(data);
}

/* inventory UI update */
function updateInventoryUI(data) {
  // friends: active if friends > 0
  const friendsEl = document.getElementById("item-friends");
  const clothesEl = document.getElementById("item-clothes");
  const mp3El = document.getElementById("item-mp3");

  if (friendsEl) toggleActive(friendsEl, data.friends > 0);
  if (clothesEl) toggleActive(clothesEl, data.clothes === true);
  if (mp3El) toggleActive(mp3El, data.mp3 === true);
}

function toggleActive(el, active) {
  if (active) el.classList.add("active");
  else el.classList.remove("active");
}

/* Logout group */
function logoutGroup() {
  localStorage.removeItem("loggedGroup");
  window.location.href = "index.html";
}

/* load immediately if on dashboard */
if (window.location.pathname.includes("dashboard.html")) {
  loadDashboard();
}

/* ------------- STATION LOGIN + PANEL (station-login.html / station-panel.html) ------------- */
function stationLogin() {
  const key = document.getElementById("stationSelect").value;
  const pw = document.getElementById("stationPw").value.trim();
  const error = document.getElementById("stationError");

  if (!key) { error.textContent = "Bitte Station wählen."; return; }
  if (!stations[key] || stations[key].password !== pw) {
    error.textContent = "Falsche Zugangsdaten!";
    return;
  }

  localStorage.setItem("loggedStation", key);
  window.location.href = "station-panel.html";
}

/* populate groups in station panel */
if (window.location.pathname.includes("station-panel.html")) {
  const key = localStorage.getItem("loggedStation");
  if (!key) window.location.href = "station-login.html";
  else {
    const station = stations[key];
    document.getElementById("stationTitle").textContent = station.name;

    const select = document.getElementById("groupSelect");
    // clear first
    select.innerHTML = "<option value=''>-- Gruppe wählen --</option>";
    Object.keys(defaultGroups).forEach(name => {
      // if localStorage has extra groups, include them too
      if (localStorage.getItem(name)) {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
      }
    });
  }
}

/* apply station action */
function applyStationAction() {
  const groupName = document.getElementById("groupSelect").value;
  const amountInput = document.getElementById("amount").value.trim();
  const note = document.getElementById("note").value.trim();
  const stationKey = localStorage.getItem("loggedStation");

  if (!groupName) { alert("Bitte Gruppe wählen!"); return; }
  if (amountInput === "") { alert("Bitte Betrag angeben!"); return; }
  const amount = parseInt(amountInput);
  if (isNaN(amount)) { alert("Ungültiger Betrag"); return; }

  // load existing or default
  const raw = localStorage.getItem(groupName);
  const data = raw ? JSON.parse(raw) : (defaultGroups[groupName] || { money: 0, friends:0, clothes:false, mp3:false, transactions:[] });

  data.money += amount;
  const label = note || `${amount >= 0 ? "+" : ""}${amount}$ durch ${stations[stationKey].name}`;
  data.transactions = data.transactions || [];
  data.transactions.push(label);

  // save
  localStorage.setItem(groupName, JSON.stringify(data));

  // clear
  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";
  alert("✅ Änderung gespeichert!");
}

/* logout station */
function logoutStation() {
  localStorage.removeItem("loggedStation");
  window.location.href = "station-login.html";
}

/* --- utility: create a new group (if you want to expand later) --- */
function createGroup(name, password) {
  if (!name || !password) return false;
  const obj = { password, money: 1000, friends: 0, clothes: false, mp3: false, transactions: [] };
  localStorage.setItem(name, JSON.stringify(obj));
  return true;
}

/* ensure that new local groups are shown - helper to sync from external code */
function syncDefaultGroups() { ensureGroupsInStorage(); }
/* ========= CASINO SYSTEM ========= */

/* Symbole */
const casinoSymbols = ["💎", "🍒", "💰", "💣", "⭐", "7️⃣"];

/* Mitarbeiter-Aktion: Casino spielen */
function casinoPlay() {
  const group = document.getElementById("groupSelect").value;
  const betInput = document.getElementById("amount").value.trim();
  const bet = parseInt(betInput);
  if (!group || isNaN(bet) || bet <= 0) return alert("Bitte gültigen Einsatz eingeben!");

  // Ereignis im localStorage ablegen → Dashboard reagiert
  const event = { group, bet, time: Date.now() };
  localStorage.setItem("casinoEvent", JSON.stringify(event));

  document.getElementById("amount").value = "";
  alert(`🎰 Spiel gestartet für ${group} (${bet}$)`);
}

/* Gruppen-Dashboard reagiert auf Casino-Ereignis */
window.addEventListener("storage", e => {
  if (e.key === "casinoEvent") {
    const event = JSON.parse(e.newValue || "{}");
    const currentGroup = localStorage.getItem("loggedGroup");
    if (currentGroup && event.group === currentGroup) {
      startCasinoAnimation(event);
    }
  }
});

/* Animation + Gewinn/Verlust-Berechnung */
function startCasinoAnimation(event) {
  const box = document.getElementById("casino-animation");
  const slots = document.getElementById("slot-symbols");
  const resultText = document.getElementById("casino-result");
  if (!box) return;

  box.classList.remove("hidden");
  resultText.textContent = "";
  slots.style.animation = "spin 0.2s infinite linear";

  // Nach 3 Sekunden stoppen und Ergebnis berechnen
  setTimeout(() => {
    slots.style.animation = "none";
    const s = [
      casinoSymbols[Math.floor(Math.random()*casinoSymbols.length)],
      casinoSymbols[Math.floor(Math.random()*casinoSymbols.length)],
      casinoSymbols[Math.floor(Math.random()*casinoSymbols.length)]
    ];
    slots.textContent = s.join("");

    const win = (s[0]===s[1] && s[1]===s[2]);
    const change = win ? event.bet*2 : -event.bet;
    resultText.textContent = win ? `Gewonnen! +${event.bet*2}$` : `Verloren! -${event.bet}$`;
    resultText.className = win ? "casino-win" : "casino-lose";

    // Geld & Transaktion updaten
    const name = event.group;
    const raw = localStorage.getItem(name);
    if (raw) {
      const data = JSON.parse(raw);
      data.money += change;
      data.transactions.push(win ? `🎰 Gewinn +${event.bet*2}$` : `🎰 Verlust -${event.bet}$`);
      localStorage.setItem(name, JSON.stringify(data));
    }

    // Nach 3 Sekunden ausblenden
    setTimeout(() => box.classList.add("hidden"), 3000);
  }, 3000);
}
