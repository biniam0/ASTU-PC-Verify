import { cloudinary } from "../config/cloudinary.js";
import {
  createLaptopImage,
  listImagesForLaptop,
  findImageById,
  clearPrimaryForLaptop,
  deleteImageById,
} from "../models/laptopImage.model.js";
import { findLaptopById } from "../models/laptop.model.js";
import { findStudentById } from "../models/student.model.js";

const ALLOWED_IMAGE_TYPES = ["front", "back", "serial", "mac", "other"];

function validateImageType(imageType) {
  if (!ALLOWED_IMAGE_TYPES.includes(imageType)) {
    const error = new Error("Invalid image type");
    error.status = 400;
    throw error;
  }
}

function uploadToCloudinary({ buffer, folder }) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer);
  });
}

export async function uploadLaptopImages({
  laptopId,
  imageType,
  files,
  userId,
}) {
  validateImageType(imageType);

  const laptop = await findLaptopById(laptopId);
  if (!laptop) {
    const error = new Error("Laptop not found");
    error.status = 404;
    throw error;
  }

  const student = await findStudentById(laptop.student_id);

  const folder = `astu/laptops/${student ? student.student_id : "unknown"}/${laptopId}/${imageType}`;

  const createdImages = [];

  for (const file of files) {
    const uploadResult = await uploadToCloudinary({
      buffer: file.buffer,
      folder,
    });

    const isPrimary = false; // primary designation can be handled separately if needed

    if (isPrimary) {
      await clearPrimaryForLaptop({ laptopId });
    }

    const img = await createLaptopImage({
      laptopId,
      imageType,
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryUrl: uploadResult.secure_url,
      isPrimary,
      uploadedByUserId: userId,
    });

    createdImages.push(img);
  }

  return createdImages;
}

export async function getLaptopImages({ laptopId }) {
  return listImagesForLaptop({ laptopId });
}

export async function deleteLaptopImage({ laptopId, imageId }) {
  const image = await findImageById(imageId);
  if (!image || image.laptop_id !== laptopId) {
    const error = new Error("Image not found for this laptop");
    error.status = 404;
    throw error;
  }

  if (image.cloudinary_public_id) {
    try {
      await cloudinary.uploader.destroy(image.cloudinary_public_id);
    } catch (err) {
      console.error(
        "Failed to delete Cloudinary image",
        image.cloudinary_public_id,
        err,
      );
    }
  }

  const deleted = await deleteImageById(imageId);
  return deleted;
}
