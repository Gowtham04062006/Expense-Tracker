
/* ================= PAGE DETECT ================= */

const currentPage = window.location.pathname.split("/").pop();

/* ================= EXPENSE STORAGE ================= */

/* ================= VALIDATION REGEX ================= */

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password rules:
// ✔ at least 8 chars
// ✔ one uppercase
// ✔ one lowercase
// ✔ one number
// ✔ one special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

function getExpenses() {
  const email = localStorage.getItem("loggedInUser");
  if (!email) return [];

  return JSON.parse(
    localStorage.getItem("expenses_" + email) || "[]"
  );
}

function saveExpenses(expenses) {
  const email = localStorage.getItem("loggedInUser");
  if (!email) return;

  localStorage.setItem(
    "expenses_" + email,
    JSON.stringify(expenses)
  );
}

/* ================= USER PROFILE ================= */

function getUserBudget() {
  const email = localStorage.getItem("loggedInUser");
  if (!email) return 0;

  const data = localStorage.getItem("userProfile_" + email);
  if (!data) return 0;

  const profile = JSON.parse(data);
  return Number(profile.budget) || 0;
}

function getTotalExpenses() {
  const expenses = getExpenses();
  return expenses.reduce((sum, e) => sum + Number(e.amount), 0);
}

/* ================= EXPENSE ANALYTICS ================= */

function parseDateSafe(dateStr) {
  // expects DD-MM-YYYY
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  return new Date(parts[2], parts[1] - 1, parts[0]);
}

function getWeeklyExpenseData() {
  const expenses = getExpenses();
  const totals = [0, 0, 0, 0, 0, 0, 0]; // Sun → Sat

  expenses.forEach(exp => {
    const d = parseDateSafe(exp.date);
    if (!d || isNaN(d)) return;
    totals[d.getDay()] += Number(exp.amount);
  });

  // reorder to Mon → Sun for your chart labels
  return [totals[1], totals[2], totals[3], totals[4], totals[5], totals[6], totals[0]];
}

function getMonthlyExpenseData() {
  const expenses = getExpenses();
  const months = new Array(12).fill(0);

  expenses.forEach(exp => {
    const d = parseDateSafe(exp.date);
    if (!d || isNaN(d)) return;
    months[d.getMonth()] += Number(exp.amount);
  });

  // your UI shows Jan–Jul
  return months;
}

function getTimeAgo(dateStr) {
  const d = parseDateSafe(dateStr);
  if (!d) return "Recently";

  const now = new Date();

  // remove time from both dates
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffDays = Math.floor((today - expDay) / (1000 * 60 * 60 * 24));

if (diffDays <= 0) return "Today";
if (diffDays === 1) return "Yesterday";
return diffDays + " days ago";
}

/* ================= NOTIFICATIONS ================= */

function updateNotifications() {
  const expenses = getExpenses();
  const budget = getUserBudget();
  const total = getTotalExpenses();

  // Budget usage
  const budgetMsg = document.querySelector(".lim_bud_per");
  if (budgetMsg && budget > 0) {
    const percent = Math.round((total / budget) * 100);

    budgetMsg.innerText =
      percent >= 100
        ? "You have exceeded your monthly budget!"
        : `You have used ${percent}% of your monthly budget.`;
  }

  // Large expense
  // Large expense
const largeMsg = document.querySelector(".shopping");
const largeTime = document.querySelector(".shopping_time");

if (largeMsg && largeTime) {
  const large = expenses.find(e => Number(e.amount) >= 2000);

  if (large) {
    largeMsg.innerText = `You spent ₹${large.amount} on ${large.category}.`;
    largeTime.innerText = getTimeAgo(large.date);
  } else {
    largeMsg.innerText = "No large expenses recently.";
    largeTime.innerText = "—";
  }
}
  // Monthly savings
  const savedMsg = document.querySelector(".saved");
const savedTime = document.querySelector(".saved_time");

if (savedMsg && savedTime) {
  const saved = budget - total;

  savedMsg.innerText =
    saved >= 0
      ? `You saved ₹${saved} this month.`
      : `You overspent by ₹${Math.abs(saved)}.`;

  // use latest expense date for freshness
  if (expenses.length > 0) {
    const latest = expenses[expenses.length - 1];
    savedTime.innerText = getTimeAgo(latest.date);
  } else {
    savedTime.innerText = "—";
  }
}
}
/* ================= DOM READY ================= */

function getCurrentMonthIndex() {
  return new Date().getMonth();
}

function getCurrentDayIndex() {
  const d = new Date().getDay(); // Sun=0
  return d === 0 ? 6 : d - 1; // convert to Mon=0
}

document.addEventListener("DOMContentLoaded", function () {

  /* ===== sidebar active ===== */
  document.querySelectorAll(".nav-item").forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  /* ================= CHARTS (PROFESSIONAL + SAFE) ================= */

// ===== WEEKLY CHART =====
if (document.getElementById("dailyChart")) {

  const weeklyData = getWeeklyExpenseData();
  const todayIndex = getCurrentDayIndex();

  const pointSizes = weeklyData.map((_, i) =>
    i === todayIndex ? 6 : 3
  );

  const pointColors = weeklyData.map((_, i) =>
    i === todayIndex ? "#00ff88" : "white"
  );

  new Chart(document.getElementById("dailyChart"), {
    type: "line",
    data: {
      labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
      datasets: [{
        data: weeklyData,
        borderColor: "white",
        backgroundColor: "transparent",
        tension: 0.4,
        pointRadius: pointSizes,
        pointBackgroundColor: pointColors,
        borderWidth: 2
      }]
    },
    options: chartOptions()
  });
}

// ===== MONTHLY CHART =====
if (document.getElementById("emailsub")) {

  const monthlyData = getMonthlyExpenseData();
  const currentMonth = getCurrentMonthIndex();

  const barColors = monthlyData.map((_, i) =>
    i === currentMonth ? "#00ff88" : "white"
  );

  new Chart(document.getElementById("emailsub"), {
    type: "bar",
    data: {
      labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      datasets: [{
        data: monthlyData,
        backgroundColor: barColors,
        borderRadius: 4
      }]
    },
    options: chartOptions()
  });
}

// ===== SECOND LINE CHART =====
if (document.getElementById("comtasks")) {

  const weeklyData2 = getWeeklyExpenseData();
  const todayIndex2 = getCurrentDayIndex();

  const pointSizes2 = weeklyData2.map((_, i) =>
    i === todayIndex2 ? 6 : 3
  );

  const pointColors2 = weeklyData2.map((_, i) =>
    i === todayIndex2 ? "#00ff88" : "white"
  );

  new Chart(document.getElementById("comtasks"), {
    type: "line",
    data: {
      labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
      datasets: [{
        data: weeklyData2,
        borderColor: "white",
        backgroundColor: "transparent",
        tension: 0.4,
        pointRadius: pointSizes2,
        pointBackgroundColor: pointColors2,
        borderWidth: 2
      }]
    },
    options: chartOptions()
  });
}
  /* ================= PROFILE LOAD ================= */

  const mail = localStorage.getItem("loggedInUser");

  const us_em = document.querySelector(".user_email");
  if (us_em && mail) us_em.innerHTML = mail;

  const detEmail = document.getElementById("det_email");
  if (detEmail) detEmail.value = mail || "";

  /* ===== save details page ===== */

  const saveBtn = document.getElementById("det_sub");
  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      const profileData = {
        name: document.getElementById("det_name").value,
        country: document.getElementById("det_country").value,
        currency: document.getElementById("det_cur").value,
        budget: document.getElementById("det_mon").value
      };

      localStorage.setItem(
        "userProfile_" + mail,
        JSON.stringify(profileData)
      );

      alert("Details saved!");
      window.location.href = "dashboard.html";
    });
  }

  /* ===== load profile page ===== */

  const profileName = document.querySelector(".user_name");
  if (profileName && mail) {
    const data = localStorage.getItem("userProfile_" + mail);

    if (data) {
      const profile = JSON.parse(data);

      document.querySelector(".user_name").value = profile.name || "";
      document.querySelector(".user_country").value = profile.country || "";
      document.querySelector(".user_curr").value = profile.currency || "";
      document.querySelector(".user_budget").value = profile.budget || "";
    }
  }

  /* ===== table + dashboard ===== */

  renderExpenses();
  updateDashboard();
  updateNotifications();
});

/* ================= CHART OPTIONS ================= */

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

/* ================= AUTH ================= */

function registerUser() {
  const email = document.getElementById("regemail").value.trim();
  const password = document.getElementById("regpassword").value.trim();
  const confirmPassword = document.getElementById("conpassword").value.trim();

  // empty check
  if (!email || !password || !confirmPassword) {
    alert("Please fill all fields");
    return;
  }

  // ✅ EMAIL REGEX CHECK
  if (!emailRegex.test(email)) {
    alert("Enter a valid email address.");
    return;
  }

  // ✅ PASSWORD REGEX CHECK
  if (!passwordRegex.test(password)) {
    alert(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
    );
    return;
  }

  // confirm password
  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  // get users
  const users = JSON.parse(localStorage.getItem("users") || "{}");

  if (users[email]) {
    alert("User already registered. Please login.");
    return;
  }

  users[email] = password;
  localStorage.setItem("users", JSON.stringify(users));

  alert("Registration successful!");
  window.location.href = "login.html";
}

function loginUser() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // ✅ email format check
  if (!emailRegex.test(email)) {
    alert("Enter a valid email address.");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "{}");

  if (!users[email]) {
    alert("User not registered. Please register first.");
    return;
  }

  if (users[email] !== password) {
    alert("Incorrect password.");
    return;
  }

  localStorage.setItem("loggedInUser", email);

  const profileData = localStorage.getItem("userProfile_" + email);

  let hasProfile = false;
  if (profileData) {
    const profile = JSON.parse(profileData);
    hasProfile = profile && profile.name && profile.budget;
  }

  window.location.href = hasProfile ? "dashboard.html" : "details.html";
}

const publicPages = [
  "login.html",
  "register.html",
  "details.html",
  "forgot_password.html"
];

const users = JSON.parse(localStorage.getItem("users") || "{}");
const hasAccount = Object.keys(users).length > 0;
const isLoggedIn = localStorage.getItem("loggedInUser");

if (!publicPages.includes(currentPage)) {
  if (!hasAccount || !isLoggedIn) {
    window.location.href = "login.html";
  }
}

function logoutUser() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
}

/* ================= PROFILE EDIT ================= */

function enableEdit() {
  document.querySelectorAll(
    ".user_name, .user_country, .user_curr, .user_budget"
  ).forEach(el => el.disabled = false);
}

function saveEdit() {
  const email = localStorage.getItem("loggedInUser");

  const profileData = {
    name: document.querySelector(".user_name").value,
    country: document.querySelector(".user_country").value,
    currency: document.querySelector(".user_curr").value,
    budget: document.querySelector(".user_budget").value
  };

  localStorage.setItem(
    "userProfile_" + email,
    JSON.stringify(profileData)
  );

  document.querySelectorAll(
    ".user_name, .user_country, .user_curr, .user_budget"
  ).forEach(el => el.disabled = true);

  alert("Profile updated!");
}

/* ================= DASHBOARD UPDATE ================= */

function updateDashboard() {
  const expenses = getExpenses();
  const total = getTotalExpenses();
  const budget = getUserBudget();
  const remaining = budget - total;

  // Monthly Budget
  const budgetEl = document.getElementById("monthlyBudget");
  if (budgetEl) budgetEl.innerText = "₹" + budget;

  // Total Expenses
  const totalEl = document.getElementById("totalExpenses");
  if (totalEl) totalEl.innerText = "₹" + total;

  // Total Transactions ✅ (THIS WAS MISSING)
  const transEl = document.getElementById("totalTransactions");
  if (transEl) transEl.innerText = expenses.length;

  // Remaining Budget
  const remainEl = document.getElementById("remainingBudget");
  if (remainEl) remainEl.innerText = "₹" + remaining;
}
/* ================= RENDER TABLE ================= */

function renderExpenses() {
  const tbody = document.getElementById("expenseBody");
  if (!tbody) return;

  const expenses = getExpenses();
  tbody.innerHTML = "";

  let total = 0;

  expenses.forEach((exp, index) => {
    total += Number(exp.amount);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${exp.date}</td>
      <td>${exp.category}</td>
      <td>${exp.desc}</td>
      <td>${exp.amount}</td>
      <td>
        <button class="act_btn" onclick="editExpense(${index})">Edit</button>
        <button class="act_btn" onclick="deleteExpense(${index})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  const totalEl = document.getElementById("totalExp");
  if (totalEl) totalEl.innerText = "₹" + total;

  const monthEl = document.getElementById("monthExp");
  if (monthEl) monthEl.innerText = "₹" + total;

  const remainEl = document.getElementById("remainBud");
  if (remainEl) {
    const userBudget = getUserBudget();
    remainEl.innerText = "₹" + (userBudget - total);
  }
}

/* ================= ADD ================= */

function addExpense() {
  const date = prompt("Enter date (DD-MM-YYYY):");
  const category = prompt("Enter category:");
  const desc = prompt("Enter description:");
  const amount = prompt("Enter amount:");

  if (!date || !category || !desc || !amount) {
    alert("All fields required!");
    return;
  }

  const expenses = getExpenses();
  expenses.push({ date, category, desc, amount });

  saveExpenses(expenses);
  renderExpenses();
  updateDashboard();
  updateNotifications();
}

/* ================= EDIT ================= */

function editExpense(index) {
  const expenses = getExpenses();
  const exp = expenses[index];

  const date = prompt("Edit date:", exp.date);
  const category = prompt("Edit category:", exp.category);
  const desc = prompt("Edit description:", exp.desc);
  const amount = prompt("Edit amount:", exp.amount);

  if (!date || !category || !desc || !amount) {
    alert("All fields required!");
    return;
  }

  expenses[index] = { date, category, desc, amount };
  saveExpenses(expenses);
  renderExpenses();
  updateDashboard();
  updateNotifications();
}

/* ================= DELETE ================= */

function deleteExpense(index) {
  const expenses = getExpenses();

  const confirmDelete = confirm("Delete this expense?");
  if (!confirmDelete) return;

  expenses.splice(index, 1);
  saveExpenses(expenses);
  renderExpenses();
  updateDashboard();
  updateNotifications();
}


function resetPassword() {
  const email = document.getElementById("fp_email").value.trim();
  const newPass = document.getElementById("fp_pass").value.trim();

  if (!email || !newPass) {
    alert("Please fill all fields");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "{}");

  if (!users[email]) {
    alert("Email not registered");
    return;
  }

  users[email] = newPass;
  localStorage.setItem("users", JSON.stringify(users));

  alert("Password reset successful!");
  window.location.href = "login.html";
}

function sendOTP() {
  const email = document.getElementById("fp_email").value.trim();

  if (!emailRegex.test(email)) {
    alert("Enter valid email");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "{}");

  if (!users[email]) {
    alert("Email not registered");
    return;
  }

  // generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  localStorage.setItem("resetOTP_" + email, otp);

  alert("Your OTP is: " + otp); // demo purpose
}

function verifyOTPAndReset() {
  const email = document.getElementById("fp_email").value.trim();
  const enteredOTP = document.getElementById("fp_otp").value.trim();
  const newPass = document.getElementById("fp_pass").value.trim();

  if (!email || !enteredOTP || !newPass) {
    alert("Please fill all fields");
    return;
  }

  // password validation
  if (!passwordRegex.test(newPass)) {
    alert("Password not strong enough");
    return;
  }

  const storedOTP = localStorage.getItem("resetOTP_" + email);

  if (!storedOTP || enteredOTP !== storedOTP) {
    alert("Invalid OTP");
    return;
  }

  // update password
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  users[email] = newPass;
  localStorage.setItem("users", JSON.stringify(users));

  localStorage.removeItem("resetOTP_" + email);

  alert("Password reset successful!");
  window.location.href = "login.html";
}

// ===== ENTER KEY SMART NAVIGATION =====
document.addEventListener("keydown", function (e) {
  if (e.key !== "Enter") return;

  const fields = Array.from(
    document.querySelectorAll("input, select")
  ).filter(el => !el.disabled && el.offsetParent !== null);

  const currentIndex = fields.indexOf(document.activeElement);

  // 👉 If not last field → move next
  if (currentIndex > -1 && currentIndex < fields.length - 1) {
    e.preventDefault();
    fields[currentIndex + 1].focus();
  }
  // 👉 If last field → submit appropriate action
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
      verifyOTPAndReset?.();
    }
  }
});