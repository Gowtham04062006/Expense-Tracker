import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update, set, get } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

function sendTelegramAlert(chatId, total, budget) {

  const token = "8533800464:AAEnuiOBjZy110Nc3PWTv_0wYgAPnnoueec"; // 🔐 replace

  if (!budget || budget <= 0) return;

  const percent = Math.round((total / budget) * 100);

  if (percent < 80) {
    localStorage.removeItem("alertSent");
  }

  if (localStorage.getItem("alertSent") === "true") return;

  if (percent < 90) return;

  const message = encodeURIComponent(
    `⚠️ Budget Warning!\n\n` +
    `You have used ${percent}% of your budget.\n` +
    `💸 Spent: ₹${total}\n` +
    `🎯 Budget: ₹${budget}`
  );

  const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${message}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        console.log("✅ Telegram alert sent");
        localStorage.setItem("alertSent", "true");
      } else {
        console.error("❌ Telegram error:", data);
      }
    })
    .catch(err => {
      console.error("❌ Network error:", err);
    });
}

function handlePersonChange() {
  const select = document.getElementById("personSelect");
  const input = document.getElementById("newPersonInput");

  if (!select || !input) return;

  if (select.value === "add_new") {
    input.style.display = "block";
    input.focus();
  } else {
    input.style.display = "none";
    input.value = "";
  }
}

async function loadPersons() {

  const token = localStorage.getItem("token");

  if (!token) return;

  try {

    const res = await fetch(
      "http://localhost:5000/api/person",
      {
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    const persons = await res.json();

    const select = document.getElementById("personSelect");

    if (!select) return;

    select.innerHTML = "";

    const selfOpt = document.createElement("option");
    selfOpt.value = "self";
    selfOpt.textContent = "Self";
    select.appendChild(selfOpt);

    persons.forEach(person => {
       
      const opt = document.createElement("option");

      opt.value = person.name;
      opt.textContent = person.name;

      select.appendChild(opt);

    });

    const addOpt = document.createElement("option");

    addOpt.value = "add_new";
    addOpt.textContent = "➕ Add Person";

    select.appendChild(addOpt);
    console.log(
  "Dropdown options:",
  document.getElementById("personSelect").options.length
);


  } catch (err) {

    console.error(err);

  }
}

function resetPasswordFirebase() {
  const email = document.getElementById("fp_email").value.trim();

  if (!email) {
    alert("Please enter your email");
    return;
  }

  sendPasswordResetEmail(auth, email)
    .then(() => {
      alert("Password reset link sent to your email!");
    })
    .catch((error) => {
      alert(error.message);
    });
}

const firebaseConfig = {
  apiKey: "AIzaSyDqFKpbqJjeETParRVdjDPcPABPRUJfsD0",
  authDomain: "expensetrackerapp-5db0e.firebaseapp.com",
  databaseURL: "https://expensetrackerapp-5db0e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "expensetrackerapp-5db0e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";

let expensesCache = [];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

/*onAuthStateChanged(auth, (user) => {
  loadPersons();
  if (!user) {
    if (!publicPages.includes(currentPage)) {
      window.location.href = "login.html";
    }
    return;
  }

  const uid = user.uid;

  const emailText = document.querySelector(".user_email");
  if (emailText) {
    emailText.innerText = user.email;
  }

  get(ref(db, "users/" + uid))
    .then(snapshot => {

      if (snapshot.exists()) {
        const profile = snapshot.val();

        userBudget = parseFloat(profile.budget) || 0;

        const nameEl = document.querySelector(".user_name");
        if (nameEl) nameEl.value = profile.name || "";

        const countryEl = document.querySelector(".user_country");
        if (countryEl) countryEl.value = profile.country || "";

        const currEl = document.querySelector(".user_curr");
        if (currEl) currEl.value = profile.currency || "";

        const budgetEl = document.querySelector(".user_budget");
        if (budgetEl) budgetEl.value = profile.budget || "";

        const chatEl = document.querySelector(".user_chatId");
        if (chatEl) chatEl.value = profile.chatId || "";
      } else {
        userBudget = 0;
      }

      loadExpensesFromFirebase();
    })
    .catch(err => console.error(err));
});*/

function getExpenses() {
  return expensesCache;
}

let userBudget = 0;

function getUserBudget() {
  return userBudget;
}

function getTotalExpenses() {
  const expenses = getExpenses();
  return expenses.reduce((sum, e) => sum + Number(e.amount), 0);
}

function parseDateSafe(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
}

function getWeeklyExpenseData() {
  const expenses = getExpenses();
  const totals = [0, 0, 0, 0, 0, 0, 0];

  const now = new Date();

  const day = now.getDay();
  const diff = (day === 0 ? -6 : 1 - day); 
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  expenses.forEach(exp => {
    const d = parseDateSafe(exp.date);
    if (!d || isNaN(d)) return;

    if (d >= monday && d <= sunday) {
      let index = d.getDay();
      index = index === 0 ? 6 : index - 1; 

      totals[index] += Number(exp.amount);
    }
  });

  return totals;
}

function getMonthlyExpenseData() {
  const expenses = getExpenses();
  const months = new Array(12).fill(0);

  const currentYear = new Date().getFullYear();

  expenses.forEach(exp => {
    const d = parseDateSafe(exp.date);
    if (!d || isNaN(d)) return;

    if (d.getFullYear() === currentYear) {
      months[d.getMonth()] += Number(exp.amount);
    }
  });

  return months;
}

function getTimeAgo(dateStr) {
  const d = parseDateSafe(dateStr);
  if (!d) return "Recently";

  const now = new Date();
  const diff = now - d; 

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return minutes + " min ago";
  if (hours < 24) return hours + " hrs ago";
  if (days === 1) return "Yesterday";
  if (days < 7) return days + " days ago";
  if (days < 30) return Math.floor(days / 7) + " weeks ago";
  if (days < 365) return Math.floor(days / 30) + " months ago";

  return Math.floor(days / 365) + " years ago";
}

function updateNotifications() {
  const expenses = getExpenses();
  const budget = getUserBudget();
  const total = getTotalExpenses();
  const budgetMsg = document.querySelector(".lim_bud_per");
  if (budgetMsg && budget > 0) {
    const percent = Math.round((total / budget) * 100);
    budgetMsg.innerText =
      percent >= 100
        ? "You have exceeded your monthly budget!"
        : `You have used ${percent}% of your monthly budget.`;
  }
const largeMsg = document.querySelector(".shopping");
const largeTime = document.querySelector(".shopping_time");
if (largeMsg && largeTime) {
  const large = [...expenses].sort((a,b)=>b.amount-a.amount)[0];
  if (large) {
    largeMsg.innerText = `You spent ₹${large.amount} on ${large.category}.`;
    largeTime.innerText = getTimeAgo(large.date);
  } else {
    largeMsg.innerText = "No large expenses recently.";
    largeTime.innerText = "—";
  }
}
const savedMsg = document.querySelector(".saved");
const savedTime = document.querySelector(".saved_time");
  
if (savedMsg && savedTime) {
  const saved = budget - total;

  savedMsg.innerText =
    saved >= 0
      ? `You saved ₹${saved} this month.`
      : `You overspent by ₹${Math.abs(saved)}.`;
  if (expenses.length > 0) {
    const latest = expenses[expenses.length - 1];
    savedTime.innerText = getTimeAgo(latest.date);
  } else {
    savedTime.innerText = "—";
  }
}
}

function getCurrentMonthIndex() {
  return new Date().getMonth();
}

function getCurrentDayIndex() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

document.addEventListener("DOMContentLoaded", function () {

  document.getElementById("yearFilter")?.addEventListener("change", renderHistory);
  const form = document.getElementById("expenseForm");
  if (form) {
    form.classList.remove("active-form"); // ✅ force hidden on load
  }
  const dateFilter = document.getElementById("dateFilter");
  if (dateFilter) {
    dateFilter.addEventListener("change", renderHistory);
  }

  const monthFilter = document.getElementById("monthFilter");
  if (monthFilter) {
    monthFilter.addEventListener("change", renderHistory);
  }

  const dayFilter = document.getElementById("dayFilter");
  if (dayFilter) {
    dayFilter.addEventListener("change", renderHistory);
  }

  const weekFilter = document.getElementById("weekFilter");
  if (weekFilter) {
    weekFilter.addEventListener("change", renderHistory);
  }

  const saveBtn = document.getElementById("det_sub");

  if (saveBtn) {
    saveBtn.addEventListener("click", async function () {

  const profileData = {
    name: document.getElementById("det_name").value,
    country: document.getElementById("det_country").value,
    currency: document.getElementById("det_cur").value,
    budget: Number(document.getElementById("det_mon").value),
    chatId: document.getElementById("chatId").value
  };

  const token = localStorage.getItem("token");

  const res = await fetch(
    "http://localhost:5000/api/profile",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify(profileData)
    }
  );

  if (res.ok) {
    alert("Details saved!");
    window.location.href = "dashboard.html";
  }
});
  }

  window.addEventListener("load", () => {
    document.querySelectorAll(".nav-item").forEach(link => {
      const linkPage = link.getAttribute("href").split("/").pop();

      if (currentPage === linkPage) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  });

});

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    layout: {
      padding: 15
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: "#ffffff",
          font: {
            size: 11,
            weight: "500"
          },
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 12
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(255,255,255,0.15)"
        },
        ticks: {
          color: "#ffffff",
          font: {
            size: 11
          }
        }
      }
    }
  };
}
function initCharts() {

  if (document.getElementById("dailyChart")) {
    const weeklyData = getWeeklyExpenseData();
    const currentDay = getCurrentDayIndex();

    if (window.dailyChartInstance) {
      window.dailyChartInstance.destroy();
    }

    window.dailyChartInstance = new Chart(document.getElementById("dailyChart"), {
      type: "line",
      data: {
        labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
        datasets: [{
          data: weeklyData,
          borderColor: weeklyData.map((_, i) => 
            i === currentDay ? "lime" : "white"
          ),
          pointBackgroundColor: weeklyData.map((_, i) => 
            i === currentDay ? "lime" : "white"
          ),
          backgroundColor: "transparent",
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: chartOptions()
    });
  }

  if (document.getElementById("emailsub")) {
    const monthlyData = getMonthlyExpenseData();
    const currentMonth = getCurrentMonthIndex();

    if (window.monthlyChartInstance) {
      window.monthlyChartInstance.destroy();
    }

    window.monthlyChartInstance = new Chart(document.getElementById("emailsub"), {
      type: "bar",
      data: {
        labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        datasets: [{
          data: monthlyData,
          backgroundColor: monthlyData.map((_, i) => 
            i === currentMonth ? "lime" : "white"
          ),
          borderRadius: 4
        }]
      },
      options: chartOptions()
    });
  }

  if (document.getElementById("comtasks")) {
    const weeklyData = getWeeklyExpenseData();
    const currentDay = getCurrentDayIndex();

    if (window.trendChartInstance) {
      window.trendChartInstance.destroy();
    }

    window.trendChartInstance = new Chart(document.getElementById("comtasks"), {
      type: "line",
      data: {
        labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
        datasets: [{
          data: weeklyData,
          borderColor: weeklyData.map((_, i) => 
            i === currentDay ? "lime" : "white"
          ),
          pointBackgroundColor: weeklyData.map((_, i) => 
            i === currentDay ? "lime" : "white"
          ),
          backgroundColor: "transparent",
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: chartOptions()
    });
  }
}

async function registerUser() {

    const email = document.getElementById("regemail").value.trim();
    const password = document.getElementById("regpassword").value.trim();
    const confirmPassword = document.getElementById("conpassword").value.trim();

    if (!emailRegex.test(email)) {
        alert("Invalid email");
        return;
    }

    if (!passwordRegex.test(password)) {
        alert("Weak password");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    try {

        const res = await fetch(
            "http://localhost:5000/api/auth/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {
            alert(data.message);
            return;
        }

        alert("Registered Successfully");

        window.location.href = "login.html";

    } catch (err) {

        alert("Server Error");

    }
}


async function loginUser() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {

        const res = await fetch(
            "http://localhost:5000/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {
            alert(data.message);
            return;
        }

        localStorage.setItem(
            "token",
            data.token
        );

        localStorage.setItem(
            "userId",
            data.userId
        );

        window.location.href = "dashboard.html";

    } catch (err) {

        alert("Server Error");

    }
}

function logoutUser() {

    localStorage.removeItem("token");
    localStorage.removeItem("userId");

    window.location.href = "login.html";
}

function enableEdit() {
  document.querySelectorAll(
    ".user_name, .user_country, .user_curr, .user_budget, .user_chatId"
  ).forEach(el => el.disabled = false);
}

async function saveEdit() {

  const profileData = {
    name: document.querySelector(".user_name").value,
    country: document.querySelector(".user_country").value,
    currency: document.querySelector(".user_curr").value,
    budget: Number(document.querySelector(".user_budget").value),
    chatId: document.querySelector(".user_chatId").value
  };

  const token = localStorage.getItem("token");

  try {

    const res = await fetch(
      "http://localhost:5000/api/profile",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(profileData)
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to save profile");
      return;
    }

    document.querySelectorAll(
      ".user_name, .user_country, .user_curr, .user_budget, .user_chatId"
    ).forEach(el => el.disabled = true);

    alert("Profile updated!");

  } catch (err) {

    console.error(err);
    alert("Server Error");

  }
}
async function loadProfile() {

  const token = localStorage.getItem("token");

  if (!token) return;

  try {

    const res = await fetch(
      "http://localhost:5000/api/profile",
      {
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    const profile = await res.json();

    userBudget = Number(profile.budget) || 0;

    const nameEl = document.querySelector(".user_name");
    if (nameEl) nameEl.value = profile.name || "";

    const countryEl = document.querySelector(".user_country");
    if (countryEl) countryEl.value = profile.country || "";

    const currEl = document.querySelector(".user_curr");
    if (currEl) currEl.value = profile.currency || "";

    const budgetEl = document.querySelector(".user_budget");
    if (budgetEl) budgetEl.value = profile.budget || "";

    const chatEl = document.querySelector(".user_chatId");
    if (chatEl) chatEl.value = profile.chatId || "";

  } catch (err) {
    console.error(err);
  }
}

function updateDashboard() {
  const expenses = getExpenses();
  const total = getTotalExpenses();
  const budget = getUserBudget();
  const remaining = budget - total;
  const budgetEl = document.getElementById("monthlyBudget");
  if (budgetEl) budgetEl.innerText = "₹" + budget;
  const totalEl = document.getElementById("totalExpenses");
  if (totalEl) totalEl.innerText = "₹" + total;
  const transEl = document.getElementById("totalTransactions");
  if (transEl) transEl.innerText = expenses.length;
  const remainEl = document.getElementById("remainingBudget");
  if (remainEl) remainEl.innerText = "₹" + remaining;
}

function renderExpenses() {
  const tbody = document.getElementById("expenseBody");
  if (!tbody) return;

  const expenses = getExpenses();
  tbody.innerHTML = "";

  let total = 0;
  let monthTotal = 0;

  const now = new Date();

  expenses.forEach((exp) => {
    const d = parseDateSafe(exp.date);
    if (!d) return;

    if (
      d.getMonth() !== now.getMonth() ||
      d.getFullYear() !== now.getFullYear()
    ) {
      return;
    }

    total += Number(exp.amount);
    monthTotal += Number(exp.amount);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${exp.date}</td>
      <td>${exp.category}</td>
      <td>${exp.desc}</td>
      <td>${exp.amount}</td>
      <td>${exp.person || "Self"}</td>
      <td>
       <button class="act_btn" onclick="editExpense('${exp._id}')">Edit</button>
       <button class="act_btn" onclick="deleteExpense('${exp._id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
  const totalEl = document.getElementById("totalExp");
  if (totalEl) totalEl.innerText = "₹" + total;

  const monthEl = document.getElementById("monthExp");
  if (monthEl) monthEl.innerText = "₹" + monthTotal;

  const remainEl = document.getElementById("remainBud");
  if (remainEl) {
    const budget = getUserBudget();
    remainEl.innerText = "₹" + (budget - total);
  }
}

async function editExpense(id) {

  const date = prompt("Edit date:");
  const category = prompt("Edit category:");
  const desc = prompt("Edit description:");
  const amount = prompt("Edit amount:");

  if (!date || !category || !desc || !amount || isNaN(amount)) {
    return;
  }

  try {

    const token = localStorage.getItem("token");

    await fetch(
      `http://localhost:5000/api/expense/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          date,
          category,
          desc,
          amount
        })
      }
    );
    

    await loadExpenses();

  } catch (err) {

    console.error(err);
    alert("Error updating expense");

  }
}

async function deleteExpense(id) {

  const confirmDelete = confirm("Delete this expense?");

  if (!confirmDelete) return;

  try {

    const token = localStorage.getItem("token");

    await fetch(
      `http://localhost:5000/api/expense/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    await loadExpenses();

    const total = expensesCache.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0
    );

    const budget = getUserBudget();

    const percent = Math.round((total / budget) * 100);

    if (percent < 90) {
      localStorage.removeItem("alertSent");
      console.log("🔄 Alert reset after delete");
    }

  } catch (err) {

    console.error(err);
    alert("Error deleting expense");

  }
}


document.addEventListener("keydown", function (e) {
  if (e.key !== "Enter") return;
  const fields = Array.from(
    document.querySelectorAll("input, select")
  ).filter(el => !el.disabled && el.offsetParent !== null);
  const currentIndex = fields.indexOf(document.activeElement);
  if (currentIndex > -1 && currentIndex < fields.length - 1) {
    e.preventDefault();
    fields[currentIndex + 1].focus();
  }
  else if (currentIndex === fields.length - 1) {
    e.preventDefault();
    if (currentPage === "login.html") {
      loginUser();
    }
    else if (currentPage === "register.html") {
      registerUser();
    }
    else if (currentPage === "details.html") {
      document.getElementById("det_sub")?.click();
    }
    else if (currentPage === "forgot_password.html") {
  resetPasswordFirebase();
}
  }
});

function togglePassword(eye){
  let container = eye.closest(".password-container");
  let pass = container.querySelector("input");
  let icon = eye.querySelector("i");

  if (!pass) return;

  if(pass.type === "password"){
    pass.type = "text";
    icon.classList.replace("fa-eye","fa-eye-slash");
  }
  else{
    pass.type = "password";
    icon.classList.replace("fa-eye-slash","fa-eye");
  }
}

async function loadExpenses() {

  const token = localStorage.getItem("token");

  if (!token) return;

  try {

    const res = await fetch(
      "http://localhost:5000/api/expense",
      {
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    const data = await res.json();

    expensesCache = data || [];

    expensesCache.sort((a, b) => {
      return parseDateSafe(b.date) - parseDateSafe(a.date);
    });

    populateYears();
    updateDashboard();
    updateNotifications();
    renderExpenses();
    renderHistory();

    if (typeof Chart !== "undefined") {
      initCharts();
    }

  } catch (err) {
    console.error(err);
  }
}

function renderHistory() {
  const tbody = document.getElementById("historyBody");
  if (!tbody) return;

  const dateFilter = document.getElementById("dateFilter")?.value; // ✅ added
  const weekFilter = document.getElementById("weekFilter")?.value;
  const dayFilter = document.getElementById("dayFilter")?.value;
  const monthFilter = document.getElementById("monthFilter")?.value;
  const yearFilter = document.getElementById("yearFilter")?.value;

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  let total = 0;
  tbody.innerHTML = "";

  const now = new Date();

  getExpenses().forEach(exp => {
    const d = parseDateSafe(exp.date);
    if (!d) return;

    if (dateFilter) {
      const [year, month, day] = dateFilter.split("-");

      if (
        d.getDate() !== Number(day) ||
        d.getMonth() !== Number(month) - 1 ||
        d.getFullYear() !== Number(year)
      ) return;
    }

    const expMonth = d.getMonth();
    const expYear = d.getFullYear();
    const expDay = d.getDay();

    const selectedMonth = monthFilter === "all" ? now.getMonth() : Number(monthFilter);
    const selectedYear = yearFilter === "all" ? now.getFullYear() : Number(yearFilter);

    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
    const expWeek = Math.ceil((d.getDate() + firstDayOfMonth.getDay()) / 7);

    let selectedWeek;
    if (weekFilter === "all") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      selectedWeek = Math.ceil((now.getDate() + first.getDay()) / 7);
    } else {
      selectedWeek = Number(weekFilter);
    }
    let match;

    if (dateFilter) {
      match = true;
    } else {
      const monthMatch = expMonth === selectedMonth;
      const yearMatch = expYear === selectedYear;
      const weekMatch = weekFilter === "all" || expWeek === selectedWeek;
      const dayMatch = dayFilter === "all" || expDay === Number(dayFilter);

      match = monthMatch && yearMatch && weekMatch && dayMatch;
    }

    if (match) {
      total += Number(exp.amount);

      const formattedDate = `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1)
        .toString().padStart(2,'0')}-${d.getFullYear()}`;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${exp.category}</td>
        <td>${exp.desc}</td>
        <td>₹${exp.amount}</td>
        <td>${exp.person || "Self"}</td>
      `;

      tbody.appendChild(row);
    }
  });

  if (tbody.innerHTML === "") {
    tbody.innerHTML = `<tr><td colspan="5">No data found</td></tr>`;
  }

  const totalEl = document.getElementById("historyTotal");
  if (totalEl) totalEl.innerText = "Total: ₹" + total;

  const title = document.getElementById("selectedMonth");
  if (title) {
    title.innerText =
      (monthFilter === "all" ? "Current Month" : monthNames[Number(monthFilter)]) +
      " - " +
      (yearFilter === "all" ? "Current Year" : yearFilter);
  }
}

function exportToExcel() {
  const table = document.getElementById("historyBody");
  if (!table) return;

  const monthFilter = document.getElementById("monthFilter")?.value;
  const yearFilter = document.getElementById("yearFilter")?.value;
  const weekFilter = document.getElementById("weekFilter")?.value;

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  let html = `
    <table border="1">
      <tr>
  <th style="background-color:#9C27B0; color:white; font-weight:bold;">Date</th>
  <th style="background-color:#9C27B0; color:white; font-weight:bold;">Category</th>
  <th style="background-color:#9C27B0; color:white; font-weight:bold;">Description</th>
  <th style="background-color:#9C27B0; color:white; font-weight:bold;">Amount</th>
  <th style="background-color:#9C27B0; color:white; font-weight:bold;">Person</th>
</tr>
  `;

  const rows = table.querySelectorAll("tr");
  let hasData = false;

  rows.forEach(row => {
    const cols = row.querySelectorAll("td");
    if (cols.length < 5) return;

    hasData = true;

    html += "<tr>";
    cols.forEach(col => {
      html += `<td>${col.innerText}</td>`;
    });
    html += "</tr>";
  });

  html += "</table>";

  if (!hasData) {
    alert("No data to export");
    return;
  }

  let fileName = "Expenses";

  if (monthFilter !== "all") {
    fileName += "_" + monthNames[Number(monthFilter)];
  }

  if (weekFilter !== "all") {
    fileName += "_Week" + weekFilter;
  }

  if (yearFilter !== "all") {
    fileName += "_" + yearFilter;
  }

  fileName += ".xls"; // IMPORTANT

  const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();

  URL.revokeObjectURL(url);
}

function showForm() {
  const form = document.getElementById("expenseForm");
  if (!form) return;

  form.classList.add("active-form");  
}

async function saveExpense() {
   
  try {
    let category = document.getElementById("catInput").value;
    const newCategory = document.getElementById("newCategoryInput").value.trim();
    const catSelect = document.getElementById("catInput");

    // CATEGORY
    if (category === "Other") {
      if (!newCategory) {
        alert("Enter category");
        return;
      }

      category = newCategory;

      const exists = [...catSelect.options].some(opt => opt.value === newCategory);

      if (!exists) {
        const option = document.createElement("option");
        option.text = newCategory;
        option.value = newCategory;
        catSelect.add(option);
      }

      catSelect.value = newCategory;
    }

    const desc = document.getElementById("descInput").value.trim();
    let amount = document.getElementById("amtInput").value;
    let dateInput = document.getElementById("dateInput").value;

    if (!category || !desc || !amount) {
      alert("Fill all fields");
      return;
    }

    if (isNaN(amount)) {
      alert("Amount must be number");
      return;
    }

    amount = Number(amount);

    // DATE
    let date;
    if (!dateInput) {
      const today = new Date();
      date = String(today.getDate()).padStart(2, '0') + "-" +
             String(today.getMonth() + 1).padStart(2, '0') + "-" +
             today.getFullYear();
    } else {
      const d = new Date(dateInput);
      date = String(d.getDate()).padStart(2, '0') + "-" +
             String(d.getMonth() + 1).padStart(2, '0') + "-" +
             d.getFullYear();
    }

    // PERSON
    const personSelect = document.getElementById("personSelect").value;
    const newPersonInput = document.getElementById("newPersonInput").value.trim();

    let person = "Self";

    

   if (personSelect === "add_new") {

  if (!newPersonInput) {
    alert("Enter person name");
    return;
  }

  person = newPersonInput;

  const token = localStorage.getItem("token");

  await fetch(
    "http://localhost:5000/api/person",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        name: person
      })
    }
  );

  await loadPersons();

} else {

  person = personSelect;

}
 

    // SAVE EXPENSE
   
    const token = localStorage.getItem("token");

await fetch(
 
  "http://localhost:5000/api/expense",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      date,
      category,
      desc,
      amount,
      person
    })
  }
);
  



await loadExpenses();


    // RESET FORM
    document.getElementById("expenseForm").classList.remove("active-form");
    document.getElementById("catInput").value = "";
    document.getElementById("descInput").value = "";
    document.getElementById("amtInput").value = "";
    document.getElementById("dateInput").value = "";

    document.getElementById("newCategoryInput").value = "";
    document.getElementById("newCategoryInput").style.display = "none";

    document.getElementById("newPersonInput").value = "";
    document.getElementById("newPersonInput").style.display = "none";

  } catch (err) {
    console.error(err);
    alert("Error saving expense");
  }
}

function populateYears() {
  const yearFilter = document.getElementById("yearFilter");
  if (!yearFilter) return;

  const years = new Set();

  expensesCache.forEach(exp => {
    const d = parseDateSafe(exp.date);
    if (d) years.add(d.getFullYear());
  });

  yearFilter.innerHTML = `<option value="all">All</option>`;

  years.forEach(y => {
    yearFilter.innerHTML += `<option value="${y}">${y}</option>`;
  });
}

function handleCategoryChange() {
  const select = document.getElementById("catInput");
  const input = document.getElementById("newCategoryInput");

  if (select.value.trim() === "Other") {
    input.style.display = "block";
    input.focus();
  } else {
    input.style.display = "none";
    input.value = "";
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  loadExpenses();
  loadPersons();
});

window.registerUser = registerUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.enableEdit = enableEdit;
window.saveEdit = saveEdit;
window.resetPasswordFirebase = resetPasswordFirebase;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.togglePassword = togglePassword;
window.showForm = showForm;
window.saveExpense = saveExpense;
window.handlePersonChange = handlePersonChange;       
window.handleCategoryChange = handleCategoryChange;
document.getElementById("weekFilter")?.addEventListener("change", renderHistory);
document.getElementById("dayFilter")?.addEventListener("change", renderHistory);
window.exportToExcel = exportToExcel;

