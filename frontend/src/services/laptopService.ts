const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

import type { Laptop, RegisterLaptopPayload } from "@/types/laptop";

function getAuthHeader(): HeadersInit {
  if (typeof window === "undefined") return {};
  try {
    const token = window.localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

interface BackendLaptop {
  id: number | string;
  student_id?: number | string | null;
  brand: string;
  model: string;
  serial_number: string;
  mac_address?: string | null;
}

interface BackendLaptopStudent {
  id: number | string;
  student_id: string;
  full_name: string;
  department?: string | null;
}

function mapLaptop(row: BackendLaptop, assignedStudentName?: string): Laptop {
  return {
    id: String(row.id),
    studentId: row.student_id != null ? String(row.student_id) : "",
    studentDbId: row.student_id != null ? String(row.student_id) : undefined,
    brandName: row.brand,
    model: row.model,
    serialNumber: row.serial_number,
    macAddress: row.mac_address ?? undefined,
    assignedTo: assignedStudentName,
  };
}

/**
 * Register a new laptop for a student.
 * Backend: POST /api/students/:studentId/laptops (JSON body)
 * Images are uploaded separately; this function focuses on the core record.
 */
export async function registerLaptop(
  payload: RegisterLaptopPayload,
): Promise<Laptop> {
  const { studentId, brandName, model, serialNumber, macAddress } = payload;

  const res = await fetch(
    `${API_BASE}/students/${encodeURIComponent(studentId)}/laptops`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        brand: brandName,
        model,
        serialNumber,
        macAddress,
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }

  const data = (await res.json()) as {
    laptop: BackendLaptop;
    student: { full_name?: string };
  };
  return mapLaptop(data.laptop, data.student?.full_name);
}

/**
 * NOTE: Backend v1 does not expose a global "list all laptops" endpoint.
 * This helper now calls GET /api/laptops for the Manage Laptops page.
 */
export async function getLaptops(): Promise<Laptop[]> {
  const res = await fetch(`${API_BASE}/laptops`, {
    headers: {
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }

  const data = (await res.json()) as {
    laptops?: (BackendLaptop & { student_full_name?: string | null })[];
  };
  const rows = Array.isArray(data.laptops) ? data.laptops : [];
  return rows.map((row) => mapLaptop(row, row.student_full_name ?? undefined));
}

/** Fetch one laptop. Backend: GET /api/laptops/:laptopId */
export async function getLaptop(id: string): Promise<Laptop> {
  const res = await fetch(`${API_BASE}/laptops/${encodeURIComponent(id)}`, {
    headers: {
      ...getAuthHeader(),
    },
  });
  if (!res.ok) throw new Error(res.statusText || `API error: ${res.status}`);
  const data = (await res.json()) as {
    laptop: BackendLaptop;
    student?: BackendLaptopStudent;
  };
  if (!data?.laptop) throw new Error("Laptop not found");
  const mapped = mapLaptop(data.laptop, data.student?.full_name);
  if (data.student) {
    mapped.studentId =
      data.student.id != null ? String(data.student.id) : mapped.studentId;
  }
  return mapped;
}

/** Update a laptop (text fields only). Backend: PUT /api/laptops/:laptopId */
export async function updateLaptop(
  id: string,
  payload: Pick<
    RegisterLaptopPayload,
    "brandName" | "model" | "serialNumber" | "macAddress"
  >,
): Promise<Laptop> {
  const res = await fetch(`${API_BASE}/laptops/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      brand: payload.brandName,
      model: payload.model,
      serialNumber: payload.serialNumber,
      macAddress: payload.macAddress,
    }),
  });
  if (!res.ok) throw new Error(res.statusText || `API error: ${res.status}`);
  const data = (await res.json()) as { laptop: BackendLaptop };
  if (!data?.laptop) throw new Error("Failed to update laptop");
  return mapLaptop(data.laptop);
}

/** Delete a laptop. Backend: DELETE /api/laptops/:laptopId */
export async function deleteLaptop(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/laptops/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeader(),
    },
  });
  if (!res.ok)
    throw new Error(res.statusText || `Delete failed: ${res.status}`);
}

export type LaptopImageType = "front" | "back" | "serial" | "mac" | "other";

export interface LaptopImage {
  id: string;
  laptop_id: string;
  image_type: LaptopImageType;
  cloudinary_url: string;
  is_primary: boolean;
}

/** Upload a single laptop image. Backend: POST /api/laptops/:laptopId/images */
export async function uploadLaptopImage(
  laptopId: string,
  imageType: LaptopImageType,
  file: File,
): Promise<LaptopImage[]> {
  const form = new FormData();
  form.append("imageType", imageType);
  form.append("images", file);

  const res = await fetch(
    `${API_BASE}/laptops/${encodeURIComponent(laptopId)}/images`,
    {
      method: "POST",
      headers: {
        ...getAuthHeader(),
        // Do NOT set Content-Type; browser will add multipart boundary.
      },
      body: form,
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Image upload failed: ${res.status}`);
  }

  const data = (await res.json()) as { images: LaptopImage[] };
  return Array.isArray(data.images) ? data.images : [];
}

/** List laptop images. Backend: GET /api/laptops/:laptopId/images */
export async function getLaptopImages(
  laptopId: string,
): Promise<LaptopImage[]> {
  const res = await fetch(
    `${API_BASE}/laptops/${encodeURIComponent(laptopId)}/images`,
    {
      headers: {
        ...getAuthHeader(),
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to load laptop images: ${res.status}`);
  }

  const data = (await res.json()) as { images?: LaptopImage[] };
  return Array.isArray(data.images) ? data.images : [];
}

/** Delete a laptop image. Backend: DELETE /api/laptops/:laptopId/images/:imageId */
export async function deleteLaptopImage(
  laptopId: string,
  imageId: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/laptops/${encodeURIComponent(laptopId)}/images/${encodeURIComponent(imageId)}`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeader(),
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to delete laptop image: ${res.status}`);
  }
}
