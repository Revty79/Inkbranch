import "server-only";

import {
  getReaderStoryDetailBySlug,
  listReaderWorldCards,
} from "@/features/story/repository";

export async function loadPublishedLibrary() {
  return listReaderWorldCards();
}

export async function loadStoryDetail(worldSlug: string) {
  return getReaderStoryDetailBySlug(worldSlug);
}
