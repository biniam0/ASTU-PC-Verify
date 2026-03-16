import { query } from "../config/db.js";

export async function createLaptopImage({
  laptopId,
  imageType,
  cloudinaryPublicId,
  cloudinaryUrl,
  isPrimary,
  uploadedByUserId,
}) {
  const result = await query(
    `INSERT INTO laptop_images (
       laptop_id, image_type, cloudinary_public_id, cloudinary_url, is_primary, uploaded_by_user_id
     ) VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      laptopId,
      imageType,
      cloudinaryPublicId,
      cloudinaryUrl,
      isPrimary,
      uploadedByUserId,
    ],
  );
  return result.rows[0];
}

export async function listImagesForLaptop({ laptopId }) {
  const result = await query(
    "SELECT * FROM laptop_images WHERE laptop_id = $1 ORDER BY created_at ASC",
    [laptopId],
  );
  return result.rows;
}

export async function findImageById(id) {
  const result = await query("SELECT * FROM laptop_images WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function clearPrimaryForLaptop({ laptopId }) {
  await query(
    "UPDATE laptop_images SET is_primary = FALSE WHERE laptop_id = $1",
    [laptopId],
  );
}

export async function deleteImageById(id) {
  const result = await query(
    "DELETE FROM laptop_images WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0] || null;
}

export async function listImagesForLaptopRaw({ laptopId }) {
  const result = await query(
    "SELECT * FROM laptop_images WHERE laptop_id = $1",
    [laptopId],
  );
  return result.rows;
}
