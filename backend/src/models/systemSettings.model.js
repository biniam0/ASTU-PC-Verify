import { prisma } from "../config/prisma.js";

export async function getAllSettings() {
  return prisma.system_settings.findMany({
    select: {
      key: true,
      value: true,
      description: true,
      data_type: true,
      updated_at: true,
      updated_by_user_id: true,
    },
    orderBy: { key: "asc" },
  });
}

export async function upsertSettings({ settings, updatedByUserId }) {
  const results = [];
  for (const setting of settings) {
    const { key, value, description, dataType } = setting;
    const updateData = {
      value,
      updated_by_user_id: updatedByUserId ?? null,
      updated_at: new Date(),
    };

    if (description !== undefined && description !== null) {
      updateData.description = description;
    }
    if (dataType !== undefined && dataType !== null) {
      updateData.data_type = dataType;
    }

    const row = await prisma.system_settings.upsert({
      where: { key },
      update: updateData,
      create: {
        key,
        value,
        description: description ?? null,
        data_type: dataType ?? null,
        updated_by_user_id: updatedByUserId ?? null,
      },
      select: {
        key: true,
        value: true,
        description: true,
        data_type: true,
        updated_at: true,
        updated_by_user_id: true,
      },
    });
    results.push(row);
  }
  return results;
}

export async function getSettingsByPrefix(prefix) {
  return prisma.system_settings.findMany({
    where: {
      key: {
        startsWith: prefix,
      },
    },
    select: {
      key: true,
      value: true,
      description: true,
      data_type: true,
      updated_at: true,
      updated_by_user_id: true,
    },
    orderBy: { key: "asc" },
  });
}

export async function getSettingsByKeys(keys) {
  return prisma.system_settings.findMany({
    where: {
      key: {
        in: keys,
      },
    },
    select: {
      key: true,
      value: true,
      description: true,
      data_type: true,
      updated_at: true,
      updated_by_user_id: true,
    },
  });
}
