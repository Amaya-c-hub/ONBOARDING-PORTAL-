export interface Task {
  id: number;
  label: string;
  description: string;
  category: string;
  required: boolean;
  done: boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function fetchTasks(): Promise<Task[]> {
  const fallbackTasks = [
    { id: 1, label: "Verify personal details",    description: "Confirm your name, address, and contact information in your profile.",                category: "Verification", required: false, done: true  },
    { id: 2, label: "Upload required documents",  description: "Submit your Passport, Educational Certificate, Experience Letter, and Insurance Card.", category: "Documents",    required: false, done: true  },
    { id: 3, label: "Sign offer letter",          description: "Review and digitally sign your offer letter before the expiry date.",                   category: "Legal",        required: true,  done: false },
    { id: 4, label: "Complete IT setup form",     description: "Fill in your equipment preferences and remote/on-site setup requirements.",             category: "IT Setup",     required: true,  done: false },
    { id: 5, label: "Acknowledge HR policies",    description: "Read and confirm acceptance of the company's code of conduct and HR policies.",         category: "HR",           required: true,  done: false },
    { id: 6, label: "Set up company email",       description: "Log in to your assigned company email and complete the account setup.",                 category: "IT Setup",     required: false, done: false },
    { id: 7, label: "Join onboarding Slack",      description: "Accept the invite and introduce yourself in #onboarding and your team channel.",        category: "HR",           required: false, done: false },
  ];

  let authToken = null;
  if (typeof window !== "undefined") {
    authToken = sessionStorage.getItem("accessToken") || localStorage.getItem("auth_token");
  }

  if (!authToken) {
    return fallbackTasks;
  }

  try {
    const res = await fetch(`${API}/portal/me/tasks`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    if (!res.ok) return fallbackTasks;
    return await res.json();
  } catch (e) {
    return fallbackTasks;
  }
}

export async function toggleTask(id: number): Promise<{ success: boolean; id: number }> {
  // Simulates an async PATCH /api/tasks/:id — replace with real fetch() when backend is ready
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, id });
    }, 0);
  });
}