"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  prepareForm,
  text,
  duplicateSlugFailure,
  saveFailure,
  UNIQUE_VIOLATION,
  type AdminFormState,
} from "@/lib/admin/form-state";
import { authorInputSchema, type AuthorInput } from "@/lib/validation/author";

export type AuthorFormState = AdminFormState;

function readForm(formData: FormData) {
  return {
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    title: text(formData, "title"),
    bio: text(formData, "bio"),
    avatarUrl: text(formData, "avatarUrl"),
    linkX: text(formData, "linkX"),
    linkLinkedin: text(formData, "linkLinkedin"),
    linkWebsite: text(formData, "linkWebsite"),
  };
}

function toRow(input: AuthorInput) {
  // Only the links that were actually given. An empty string in the JSON would
  // render an anchor pointing nowhere.
  const links: Record<string, string> = {};
  if (input.linkX) links.x = input.linkX;
  if (input.linkLinkedin) links.linkedin = input.linkLinkedin;
  if (input.linkWebsite) links.website = input.linkWebsite;

  return {
    name: input.name,
    slug: input.slug,
    title: input.title,
    bio: input.bio,
    avatar_url: input.avatarUrl,
    links,
  };
}

function refresh() {
  revalidatePath("/admin/authors");
  revalidatePath("/reviews");
}

export async function createAuthorAction(
  _prevState: AuthorFormState,
  formData: FormData,
): Promise<AuthorFormState> {
  const prepared = await prepareForm(authorInputSchema, readForm(formData));
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, raw } = prepared;

  const { error } = await supabase.from("authors").insert(toRow(input));

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return duplicateSlugFailure(input.slug, raw);
    return saveFailure("author", raw);
  }

  refresh();
  redirect("/admin/authors");
}

export async function updateAuthorAction(
  _prevState: AuthorFormState,
  formData: FormData,
): Promise<AuthorFormState> {
  const id = text(formData, "id");
  if (!id) {
    return { status: "error", message: "Missing author id. Reload the page and try again." };
  }

  const prepared = await prepareForm(authorInputSchema, readForm(formData));
  if (!prepared.ok) return prepared.failure;

  const { supabase, input, raw } = prepared;

  const { error } = await supabase.from("authors").update(toRow(input)).eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return duplicateSlugFailure(input.slug, raw);
    return saveFailure("author", raw);
  }

  refresh();
  redirect("/admin/authors");
}
