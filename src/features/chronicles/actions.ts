"use server";

import {
  applyGuidedActionForUser,
  applyChoiceForUser,
  createChronicleForUser,
  createPerspectiveRunForUser,
} from "@/features/story/repository";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function mustBeString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
  return value.trim();
}

export async function startChronicleAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const versionId = mustBeString(formData.get("versionId"), "versionId");
  const worldSlug = mustBeString(formData.get("worldSlug"), "worldSlug");

  const chronicle = await createChronicleForUser({
    userId: user.id,
    versionId,
  });

  revalidatePath("/app/library");
  revalidatePath("/app/chronicles");
  redirect(`/app/chronicles/${chronicle.id}/select-perspective?world=${worldSlug}`);
}

export async function startPerspectiveRunAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const chronicleId = mustBeString(formData.get("chronicleId"), "chronicleId");
  const viewpointId = mustBeString(formData.get("viewpointId"), "viewpointId");

  const run = await createPerspectiveRunForUser({
    userId: user.id,
    chronicleId,
    viewpointId,
  });

  revalidatePath(`/app/chronicles/${chronicleId}`);
  revalidatePath("/app/chronicles");
  redirect(`/app/chronicles/${chronicleId}/runs/${run.id}`);
}

export async function chooseBeatChoiceAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const chronicleId = mustBeString(formData.get("chronicleId"), "chronicleId");
  const runId = mustBeString(formData.get("runId"), "runId");
  const choiceId = mustBeString(formData.get("choiceId"), "choiceId");
  const actionNoteEntry = formData.get("actionNote");
  const actionNote =
    typeof actionNoteEntry === "string" && actionNoteEntry.trim()
      ? actionNoteEntry.trim()
      : undefined;

  const result = await applyChoiceForUser({
    userId: user.id,
    chronicleId,
    runId,
    choiceId,
    actionNote,
  });

  revalidatePath(`/app/chronicles/${chronicleId}/runs/${runId}`);
  revalidatePath("/app/chronicles");

  if (result.runCompleted) {
    redirect(`/app/chronicles/${chronicleId}`);
  }

  redirect(`/app/chronicles/${chronicleId}/runs/${runId}`);
}

export async function chooseGuidedActionAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const chronicleId = mustBeString(formData.get("chronicleId"), "chronicleId");
  const runId = mustBeString(formData.get("runId"), "runId");
  const actionText = mustBeString(formData.get("actionText"), "actionText");

  const result = await applyGuidedActionForUser({
    userId: user.id,
    chronicleId,
    runId,
    actionText,
  });

  revalidatePath(`/app/chronicles/${chronicleId}/runs/${runId}`);
  revalidatePath("/app/chronicles");

  if (!result.accepted) {
    redirect(`/app/chronicles/${chronicleId}/runs/${runId}?guided=unsupported`);
  }

  if (result.runCompleted) {
    redirect(`/app/chronicles/${chronicleId}?guided=completed`);
  }

  const guidedStatus = result.usedFallback ? "fallback" : "resolved";
  redirect(`/app/chronicles/${chronicleId}/runs/${runId}?guided=${guidedStatus}`);
}
