const SUPABASE_URL = "https://smblbmcmsibvbpaardmk.supabase.co";
const SUPABASE_KEY = "sb_publishable_K_xB73yCQ0QPvsndLIGamQ_G1NLIs_d";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
class UserManager {

  constructor(client) {

    this.client = client;

  }

  // REGISTER

  async registerUser() {

    const fullName = document.getElementById("fullName").value.trim();

    const email = document.getElementById("email").value.trim();

    const password = document.getElementById("password").value.trim();

    const role = document.getElementById("role").value.toLowerCase();

    const department = document.getElementById("department").value.trim();

    const msg = document.getElementById("registerMsg");

    const { error } = await this.client.from("users").insert([{
      

      full_name: fullName,

      email: email,

      password: password,

      role: role,

      department: department,

      is_active: true

    }]);

    if (error) {

      msg.innerText = error.message;

    } else {

      msg.innerText = "Registered successfully!";

      window.location.href = "index.html";

    }

  }

  // LOGIN

  async loginUser() {

    const email = document.getElementById("loginEmail").value.trim();

    const password = document.getElementById("loginPassword").value.trim();

    const msg = document.getElementById("loginMsg");

    const { data, error } = await this.client

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

  loadProfile() {

    const user = JSON.parse(localStorage.getItem("user"));

    const msg = document.getElementById("profileMsg");

    if (!user) {

      if (msg) msg.innerText = "No user found. Please login again.";

      return;

    }

    document.getElementById("profileEmail").value = user.email;

  }

  // UPDATE PASSWORD

  async updateProfile() {

    const user = JSON.parse(localStorage.getItem("user"));

    const msg = document.getElementById("profileMsg");

    if (!user) {

      msg.innerText = "No user found. Please login again.";

      return;

    }

    const currentPassword = document.getElementById("currentPassword").value.trim();

    const newPassword = document.getElementById("newPassword").value.trim();

    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (currentPassword !== user.password) {

      msg.innerText = "Current password is incorrect!";

      return;

    }

    if (!newPassword) {

      msg.innerText = "Please enter new password!";

      return;

    }

    if (newPassword !== confirmPassword) {

      msg.innerText = "New password and confirm password do not match!";

      return;

    }

    const { error } = await this.client

      .from("users")

      .update({ password: newPassword })

      .eq("id", user.id);

    if (error) {

      msg.innerText = error.message;

    } else {

      user.password = newPassword;

      localStorage.setItem("user", JSON.stringify(user));

      msg.innerText = "Password updated successfully!";

    }

  }

  // DELETE MY ACCOUNT

  async deleteMyAccount() {

    const user = JSON.parse(localStorage.getItem("user"));

    const msg = document.getElementById("profileMsg");

    if (!user) {

      msg.innerText = "No user found. Please login again.";

      return;

    }

    const confirmDelete = confirm("Are you sure you want to delete your account?");

    if (!confirmDelete) {

      return;

    }

    const { error } = await this.client

      .from("users")

      .delete()

      .eq("id", user.id);

    if (error) {

      msg.innerText = error.message;

    } else {

      localStorage.removeItem("user");

      alert("Your account has been deleted successfully!");

      window.location.href = "index.html";

    }

  }

  logoutUser() {

    localStorage.removeItem("user");

    window.location.href = "index.html";

  }

}

const userManager = new UserManager(client);

function registerUser() {

  userManager.registerUser();

}

function loginUser() {

  userManager.loginUser();

}

function loadProfile() {

  userManager.loadProfile();

}

function updateProfile() {

  userManager.updateProfile();

}

function deleteMyAccount() {

  userManager.deleteMyAccount();

}

function logoutUser() {

  userManager.logoutUser();

}
