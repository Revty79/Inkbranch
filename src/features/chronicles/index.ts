import "server-only";

import {
  getChronicleByIdForUser,
  getPerspectiveRunContextForUser,
  listChronicleSummariesForUser,
  listViewpointsForChronicle,
} from "@/features/story/repository";

export async function loadChronicleSummaries(userId: string) {
  return listChronicleSummariesForUser(userId);
}

export async function loadChronicle(userId: string, chronicleId: string) {
  return getChronicleByIdForUser({ userId, chronicleId });
}

export async function loadPerspectiveSelection(userId: string, chronicleId: string) {
  return listViewpointsForChronicle({ userId, chronicleId });
}

export async function loadPerspectiveRun(
  userId: string,
  chronicleId: string,
  runId: string,
) {
  return getPerspectiveRunContextForUser({ userId, chronicleId, runId });
}
