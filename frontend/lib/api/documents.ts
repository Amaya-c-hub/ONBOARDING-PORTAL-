export type DocStatus = "Approved" | "Pending" | "Rejected";

export interface Doc {
  id: string | number;
  type: string;
  name: string;
  size: string;
  uploadedOn: string;
  status: DocStatus;
  expiryDate: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function fetchDocuments(): Promise<Doc[]> {
  let authToken = null;
  if (typeof window !== "undefined") {
    authToken = sessionStorage.getItem("accessToken") || localStorage.getItem("auth_token");
  }

  if (!authToken) {
    return [];
  }

  try {
    const res = await fetch(`${API_URL}/portal/me/documents`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch documents: ${res.status} - ${errorText}`);
    }
    return await res.json();
  } catch (err) {
    console.error("fetchDocuments error:", err);
    return [];
  }
}

export async function uploadDocument(
  file: File,
  documentType: string,
  expiryDate?: string | null
): Promise<Doc> {
  const candidateId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("email") || "unknown"
      : "unknown";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);
  formData.append("candidateId", candidateId);
  if (expiryDate) formData.append("expiryDate", expiryDate);

  const res = await fetch(`${API_URL}/documents/upload/single`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(errBody || "Failed to upload document");
  }

  const data = await res.json();
  return {
    id: data.id,
    type: documentType,
    name: data.originalName,
    size: `${(data.sizeBytes / (1024 * 1024)).toFixed(1)} MB`,
    uploadedOn: new Date(data.uploadedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    status: "Pending",
    expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString().split("T")[0] : null,
  };
}

export async function deleteDocument(
  id: string | number
): Promise<{ success: boolean; id: string | number }> {
  try {
    const res = await fetch(`${API_URL}/documents/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete document");
    return { success: true, id };
  } catch (err) {
    console.error("deleteDocument error:", err);
    return { success: false, id };
  }
}