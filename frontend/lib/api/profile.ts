export interface ProfileData {
  name:    string;
  email:   string;
  phone:   string;
  address: string;
}

export async function fetchProfile(): Promise<ProfileData> {
  // Simulates GET /api/profile
  return new Promise((resolve) => {
    setTimeout(() => {
      // In browser environment, grab the email they logged in with
      let currentEmail = "candidate@example.com";
      let name = "Candidate";
      if (typeof window !== "undefined") {
        currentEmail = sessionStorage.getItem("email") || currentEmail;
        name = currentEmail.split("@")[0];
        // Capitalize the first letter
        name = name.charAt(0).toUpperCase() + name.slice(1);
      }
      
      resolve({
        name:    name,
        email:   currentEmail,
        phone:   "+91 98765 43210",
        address: "Chennai, Tamil Nadu, IN",
      });
    }, 0);
  });
}

export async function updateProfile(data: ProfileData): Promise<ProfileData> {
  // Simulates PATCH /api/profile { ...data } — replace with real fetch() when backend is ready
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...data });
    }, 0);
  });
}