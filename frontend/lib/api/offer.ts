export type OfferStatus = "pending" | "signing" | "signed" | "rejected";

export interface Offer {
  candidateName: string;
  role:          string;
  department:    string;
  salary:        string;
  joiningDate:   string;
  expiresOn:     string;
  company:       string;
  status:        OfferStatus;
  signature:     string | null;
  pdfUrl?:       string | null;
  templateType?: string | null;
  location:      string;
  reportingTo:   string;
  probationPeriod: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getToken(): string | null {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  }
  return null;
}

export async function fetchOffer(): Promise<Offer> {
  const token = getToken();
  
  if (!token) {
    // If no magic token, fetch via JWT auth token
    let authToken = null;
    if (typeof window !== "undefined") {
      authToken = sessionStorage.getItem("accessToken") || localStorage.getItem("auth_token");
    }
    
    if (!authToken) {
      throw new Error("User not authenticated.");
    }
    
    const res = await fetch(`${API}/portal/me/offer`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    
    if (!res.ok) {
      if (res.status === 404) return null as any;
      throw new Error("Failed to fetch dashboard offer");
    }
    
    const data = await res.json();
    
    const t = data.offer?.templateType;
    const role = t === 'EXECUTIVE' ? 'Executive Officer' : t === 'INTERN' ? 'Engineering Intern' : 'Frontend Engineer';
    const department = t === 'EXECUTIVE' ? 'Executive Management' : 'Product & Engineering';
    const salary = t === 'EXECUTIVE' ? 'Tier 1 Executive Compensation' : t === 'INTERN' ? 'Monthly Educational Allowance' : 'Competitive Market Rate';
    const location = t === 'EXECUTIVE' ? 'London, UK (HQ)' : t === 'INTERN' ? 'Kozhikode, Kerala (On-site)' : 'Kozhikode, Kerala (Hybrid)';
    const reportingTo = t === 'EXECUTIVE' ? 'Board of Directors' : t === 'INTERN' ? 'Senior Architect' : 'Engineering Manager';
    const probationPeriod = t === 'EXECUTIVE' ? '6 Months' : t === 'INTERN' ? 'N/A (Fixed Term)' : '2 Months';

    return {
      candidateName: data.candidate?.firstName ? `${data.candidate.firstName} ${data.candidate.lastName || ''}`.trim() : "Candidate",
      role: role,
      department: department,
      salary: salary,
      joiningDate: data.joiningDate || "TBD",
      expiresOn: data.candidate?.magicTokenExpiry ? new Date(data.candidate.magicTokenExpiry).toLocaleDateString() : "TBD",
      company: "Linnk Global Solutions",
      status: data.offer?.status?.toLowerCase() === "signed" ? "signed" : 
              data.offer?.status?.toLowerCase() === "rejected" ? "rejected" : "pending",
      signature: data.offer?.signatureId || null,
      pdfUrl: data.offer?.pdfUrl || null,
      templateType: t || null,
      location: location,
      reportingTo: reportingTo,
      probationPeriod: probationPeriod,
    };
  }

  const res = await fetch(`${API}/portal/offer?token=${token}`);
  if (!res.ok) {
    if (res.status === 404) return null as any;
    throw new Error("Failed to fetch offer or offer expired");
  }
  
  const data = await res.json();
  
  const t = data.offer?.templateType;
  const role = t === 'EXECUTIVE' ? 'Executive Officer' : t === 'INTERN' ? 'Engineering Intern' : 'Frontend Engineer';
  const department = t === 'EXECUTIVE' ? 'Executive Management' : 'Product & Engineering';
  const salary = t === 'EXECUTIVE' ? 'Tier 1 Executive Compensation' : t === 'INTERN' ? 'Monthly Educational Allowance' : 'Competitive Market Rate';
  const location = t === 'EXECUTIVE' ? 'London, UK (HQ)' : t === 'INTERN' ? 'Kozhikode, Kerala (On-site)' : 'Kozhikode, Kerala (Hybrid)';
  const reportingTo = t === 'EXECUTIVE' ? 'Board of Directors' : t === 'INTERN' ? 'Senior Architect' : 'Engineering Manager';
  const probationPeriod = t === 'EXECUTIVE' ? '6 Months' : t === 'INTERN' ? 'N/A (Fixed Term)' : '2 Months';
  
  // Transform backend payload to frontend Offer structure
  return {
    candidateName: data.candidate?.firstName ? `${data.candidate.firstName} ${data.candidate.lastName || ''}`.trim() : "Candidate",
    role: role,
    department: department,
    salary: salary,
    joiningDate: data.joiningDate || "TBD",
    expiresOn: data.candidate?.magicTokenExpiry ? new Date(data.candidate.magicTokenExpiry).toLocaleDateString() : "TBD",
    company: "Linnk Global Solutions",
    status: data.offer?.status?.toLowerCase() === "signed" ? "signed" : 
            data.offer?.status?.toLowerCase() === "rejected" ? "rejected" : "pending",
    signature: data.offer?.signatureId || null,
    pdfUrl: data.offer?.pdfUrl || null,
    templateType: t || null,
    location: location,
    reportingTo: reportingTo,
    probationPeriod: probationPeriod,
  };
}

export async function acceptOffer(signature: string): Promise<{ status: "signed"; signature: string }> {
  const token = getToken();

  if (!token) {
    let authToken = null;
    if (typeof window !== "undefined") {
      authToken = sessionStorage.getItem("accessToken") || localStorage.getItem("auth_token");
    }
    if (!authToken) throw new Error("Missing secure token or auth session");

    const res = await fetch(`${API}/portal/me/offer/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
      body: JSON.stringify({ signatureImage: signature })
    });
    
    if (!res.ok) throw new Error("Failed to accept offer");
    return { status: "signed", signature };
  }

  const res = await fetch(`${API}/portal/offer/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, signatureImage: signature })
  });
  
  if (!res.ok) throw new Error("Failed to accept offer");
  return { status: "signed", signature };
}

export async function rejectOffer(): Promise<{ status: "rejected" }> {
  const token = getToken();

  if (!token) {
    let authToken = null;
    if (typeof window !== "undefined") {
      authToken = sessionStorage.getItem("accessToken") || localStorage.getItem("auth_token");
    }
    if (!authToken) throw new Error("Missing secure token or auth session");

    const res = await fetch(`${API}/portal/me/offer/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
      body: JSON.stringify({ reason: "Declined by candidate" })
    });
    
    if (!res.ok) throw new Error("Failed to reject offer");
    return { status: "rejected" };
  }

  const res = await fetch(`${API}/portal/offer/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, reason: "Declined by candidate" })
  });
  
  if (!res.ok) throw new Error("Failed to reject offer");
  return { status: "rejected" };
}