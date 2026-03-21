import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getLaptop,
  getLaptopImages,
  deleteLaptop,
  deleteLaptopImage,
  uploadLaptopImage,
  type LaptopImage,
  type LaptopImageType,
} from "@/services/laptopService";
import { getScanHistoryForStudentDb } from "@/services/verificationService";
import { useAuth } from "@/hooks/useAuth";
import type { Laptop } from "@/types/laptop";
import type { ScanHistoryEntry } from "@/types/verification";

function LaptopIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 5a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 11l2.5 2.5L14 10l4 4"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m4-3a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function formatDate(value: string | Date | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

const IMAGE_TYPE_LABEL: Record<LaptopImageType, string> = {
  front: "Front",
  back: "Back",
  serial: "Serial",
  mac: "MAC",
  other: "Other",
};

export function LaptopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [laptop, setLaptop] = useState<Laptop | null>(null);
  const [images, setImages] = useState<LaptopImage[]>([]);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<LaptopImage | null>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!id) {
      setError("Missing laptop id");
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        const [l, imgs] = await Promise.all([
          getLaptop(id),
          getLaptopImages(id).catch(() => []),
        ]);
        if (cancelled) return;
        setLaptop(l);
        setImages(imgs);
        if (l.studentDbId) {
          getScanHistoryForStudentDb(l.studentDbId)
            .then((logs) => {
              if (!cancelled) setHistory(logs);
            })
            .catch(() => {
              // ignore history errors for detail page
            });
        }
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load laptop",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDeleteLaptop() {
    if (!laptop) return;
    if (
      !window.confirm(
        `Delete laptop "${laptop.brandName} ${laptop.model}" (${laptop.serialNumber})?`,
      )
    )
      return;
    try {
      await deleteLaptop(laptop.id);
      navigate("/manage-laptops", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete laptop");
    }
  }

  async function handleUploadImage(
    e: React.ChangeEvent<HTMLInputElement>,
    imageType: LaptopImageType,
  ) {
    if (!laptop) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setImageUploading(true);
    try {
      const uploaded = await uploadLaptopImage(laptop.id, imageType, file);
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  }

  async function handleDeleteImage(image: LaptopImage) {
    if (!laptop) return;
    if (!window.confirm("Delete this image?")) return;
    try {
      await deleteLaptopImage(laptop.id, image.id);
      setImages((prev) => prev.filter((img) => img.id !== image.id));
      if (selectedImage?.id === image.id) setSelectedImage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    }
  }

  const primaryImage = useMemo(
    () => images.find((img) => img.is_primary) ?? images[0],
    [images],
  );

  const imagesByType = useMemo(() => {
    const groups: Partial<Record<LaptopImageType, LaptopImage[]>> = {};
    for (const img of images) {
      const key = img.image_type;
      groups[key] = groups[key] ? [...groups[key]!, img] : [img];
    }
    return groups;
  }, [images]);

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading…</div>;
  }

  if (!laptop) {
    return (
      <div>
        <div className="-mx-6 -mt-6 mb-6 flex items-center gap-2 bg-teal-500 px-6 py-3">
          <LaptopIcon className="h-6 w-6 shrink-0 text-white" />
          <h2 className="text-lg font-semibold text-white">Laptop details</h2>
        </div>
        <p className="text-sm text-gray-600">Laptop not found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="-mx-6 -mt-6 mb-6 flex items-center justify-between bg-teal-500 px-6 py-3">
        <div className="flex items-center gap-2">
          <LaptopIcon className="h-6 w-6 shrink-0 text-white" />
          <div>
            <h2 className="text-lg font-semibold text-white">
              {laptop.brandName} {laptop.model}
            </h2>
            <p className="text-xs text-teal-50">
              Serial: {laptop.serialNumber || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              navigate(`/laptops/${laptop.id}/edit`, { state: { laptop } })
            }
            className="inline-flex items-center gap-1 rounded bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
          >
            <PencilIcon className="h-4 w-4" /> Edit
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={handleDeleteLaptop}
              className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              <TrashIcon className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: specs + student */}
        <div className="space-y-4 lg:col-span-1">
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Specifications
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-gray-500">Serial number</dt>
                <dd className="flex items-center gap-2 text-gray-900">
                  <span>{laptop.serialNumber || "—"}</span>
                  {laptop.serialNumber && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(laptop.serialNumber!)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="Copy serial number"
                    >
                      <ClipboardIcon className="h-4 w-4" />
                    </button>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-gray-500">MAC address</dt>
                <dd className="flex items-center gap-2 text-gray-900">
                  <span>{laptop.macAddress || "—"}</span>
                  {laptop.macAddress && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(laptop.macAddress!)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="Copy MAC address"
                    >
                      <ClipboardIcon className="h-4 w-4" />
                    </button>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Assigned student
            </h3>
            {laptop.assignedTo ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-900">{laptop.assignedTo}</p>
                {laptop.studentId && (
                  <p className="text-gray-600">
                    Internal ID:{" "}
                    <span className="font-mono text-xs">
                      {laptop.studentId}
                    </span>
                  </p>
                )}
                <div className="pt-2">
                  <Link
                    to="/manage-students"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    View in Manage Students
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                This laptop is not currently assigned to a student.
              </p>
            )}
          </section>
        </div>

        {/* Middle column: primary image + gallery */}
        <div className="space-y-4 lg:col-span-1">
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Laptop images
              </h3>
              {imageUploading && (
                <span className="text-xs text-gray-500">Uploading…</span>
              )}
            </div>
            {primaryImage ? (
              <div className="overflow-hidden rounded border border-gray-100">
                <img
                  src={primaryImage.cloudinary_url}
                  alt={`${laptop.brandName} ${laptop.model}`}
                  className="h-48 w-full cursor-pointer object-cover"
                  onClick={() => setSelectedImage(primaryImage)}
                />
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
                No images uploaded.
              </div>
            )}

            <div className="mt-4 grid grid-cols-5 gap-2">
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`group relative h-16 overflow-hidden rounded border ${
                    img.id === primaryImage?.id
                      ? "border-teal-500"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={img.cloudinary_url}
                    alt={IMAGE_TYPE_LABEL[img.image_type]}
                    className="h-full w-full object-cover group-hover:opacity-90"
                  />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 text-[10px] text-white">
                    {IMAGE_TYPE_LABEL[img.image_type]}
                  </span>
                </button>
              ))}
            </div>

            {isAdmin && (
              <div className="mt-4 space-y-2 text-xs">
                <p className="font-medium text-gray-700">Add image</p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "front",
                      "back",
                      "serial",
                      "mac",
                      "other",
                    ] as LaptopImageType[]
                  ).map((type) => (
                    <label
                      key={type}
                      className="inline-flex cursor-pointer items-center gap-1 rounded border border-gray-300 bg-gray-50 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
                    >
                      <ImageIcon className="h-3 w-3" />
                      <span>{IMAGE_TYPE_LABEL[type]}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUploadImage(e, type)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right column: verification history */}
        <div className="space-y-4 lg:col-span-1">
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <ClockIcon className="h-4 w-4 text-gray-500" /> Verification
                history
              </h3>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">
                No scan history found for this laptop's student.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto text-xs">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium text-gray-600">
                        When
                      </th>
                      <th className="px-2 py-1 text-left font-medium text-gray-600">
                        Gate
                      </th>
                      <th className="px-2 py-1 text-left font-medium text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {history.map((h) => (
                      <tr key={h.id}>
                        <td className="px-2 py-1 align-top text-gray-900">
                          {formatDate(h.createdAt)}
                        </td>
                        <td className="px-2 py-1 align-top text-gray-700">
                          {h.gateLocation || "—"}
                        </td>
                        <td className="px-2 py-1 align-top text-gray-700">
                          {h.status || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-h-full max-w-3xl overflow-hidden rounded bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.cloudinary_url}
              alt={IMAGE_TYPE_LABEL[selectedImage.image_type]}
              className="max-h-[80vh] w-full object-contain"
            />
            <div className="absolute left-0 right-0 top-0 flex items-center justify-between bg-black/60 px-3 py-1 text-xs text-white">
              <span>
                {IMAGE_TYPE_LABEL[selectedImage.image_type]} view • ID{" "}
                {selectedImage.id}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedImage.cloudinary_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
                >
                  Open
                </a>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(selectedImage)}
                    className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700"
                  >
                    <TrashIcon className="h-3 w-3" /> Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
