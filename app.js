const SUPABASE_URL = "https://smblbmcmsibvbpaardmk.supabase.co";
const SUPABASE_KEY = "sb_publishable_K_xB73yCQ0QPvsndLIGamQ_G1NLIs_d";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// REGISTER
async function registerUser() {
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value.toLowerCase();
  const department = document.getElementById("department").value.trim();
  const msg = document.getElementById("registerMsg");

  const { error } = await client.from("users").insert([{
    full_name: fullName,
    email,
    password,
    role,
    department,
    is_active: true
  }]);

  if (error) {
    msg.innerText = error.message;
  } else {
    msg.innerText = "Registered!";
    window.location.href = "index.html";
  }
}

// LOGIN
async function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const msg = document.getElementById("loginMsg");

  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("password", password)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    msg.innerText = "Invalid login";
    return;
  }

  localStorage.setItem("user", JSON.stringify(data));

  if (data.role === "student") {
    window.location.href = "student.html";
  } else {
    window.location.href = "admin.html";
  }
}

// LOAD PROFILE
function loadProfile() {
  const user = JSON.parse(localStorage.getItem("user"));

  document.getElementById("profileName").value = user.full_name;
  document.getElementById("profileEmail").value = user.email;
  document.getElementById("profileDepartment").value = user.department;
}

// UPDATE
async function updateProfile() {
  const user = JSON.parse(localStorage.getItem("user"));

  const fullName = document.getElementById("profileName").value;
  const password = document.getElementById("profilePassword").value;
  const department = document.getElementById("profileDepartment").value;

  const updateData = {
    full_name: fullName,
    department
  };

  if (password) updateData.password = password;

  const { error } = await client
    .from("users")
    .update(updateData)
    .eq("id", user.id);

  document.getElementById("profileMsg").innerText =
    error ? error.message : "Updated!";
}

// LOGOUT
function logoutUser() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}