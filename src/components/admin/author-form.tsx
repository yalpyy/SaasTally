"use client";

import { useActionState } from "react";
import {
  createAuthorAction,
  updateAuthorAction,
  initialAuthorFormState,
  type AuthorFormState,
} from "@/app/(admin)/admin/authors/actions";
import {
  Field,
  Fieldset,
  FormError,
  SubmitRow,
  inputClass,
  useSlugPair,
} from "@/components/admin/form-primitives";

export interface AuthorFormValues {
  id: string;
  name: string;
  slug: string;
  title: string;
  bio: string;
  avatarUrl: string;
  linkX: string;
  linkLinkedin: string;
  linkWebsite: string;
}

export function AuthorForm({ author }: { author?: AuthorFormValues }) {
  const isEdit = Boolean(author);

  const [state, formAction, isPending] = useActionState<AuthorFormState, FormData>(
    isEdit ? updateAuthorAction : createAuthorAction,
    initialAuthorFormState,
  );

  const errors = state.fieldErrors ?? {};
  const submitted = state.values;

  function initial(field: keyof AuthorFormValues): string {
    const attempted = submitted?.[field];
    if (typeof attempted === "string") return attempted;
    const saved = author?.[field];
    return typeof saved === "string" ? saved : "";
  }

  const name = useSlugPair(initial("name"), initial("slug"), isEdit);

  return (
    <form action={formAction} className="space-y-8">
      {isEdit ? <input type="hidden" name="id" value={author!.id} /> : null}

      {state.status === "error" ? <FormError message={state.message} /> : null}

      <Fieldset
        title="Byline"
        description="Who a reader is being asked to trust. This is the whole reason the page exists, so it is worth filling in properly."
      >
        <Field label="Name" name="name" error={errors.name} required>
          <input
            id="name"
            name="name"
            value={name.title}
            onChange={(event) => name.onTitleChange(event.target.value)}
            required
            className={inputClass}
            placeholder="Jamie Rivera"
          />
        </Field>

        <Field
          label="Slug"
          name="slug"
          error={errors.slug}
          required
          hint="Identifies the author. Public author pages are not built yet, so nothing links to this today."
        >
          <input
            id="slug"
            name="slug"
            value={name.slug}
            onChange={(event) => name.onSlugChange(event.target.value)}
            required
            className={inputClass}
            placeholder="jamie-rivera"
          />
        </Field>

        <Field label="Title" name="title" error={errors.title} hint="Role or area of expertise.">
          <input
            id="title"
            name="title"
            defaultValue={initial("title")}
            className={inputClass}
            placeholder="Senior editor, marketing software"
          />
        </Field>

        <Field
          label="Bio"
          name="bio"
          error={errors.bio}
          hint="What qualifies them to recommend this software. Concrete experience beats adjectives."
        >
          <textarea
            id="bio"
            name="bio"
            rows={5}
            defaultValue={initial("bio")}
            className={inputClass}
          />
        </Field>

        <Field label="Avatar URL" name="avatarUrl" error={errors.avatarUrl}>
          <input
            id="avatarUrl"
            name="avatarUrl"
            defaultValue={initial("avatarUrl")}
            className={inputClass}
            placeholder="https://…/authors/jamie.jpg"
          />
        </Field>
      </Fieldset>

      <Fieldset title="Links" description="Optional. Left blank, nothing is rendered.">
        <Field label="X" name="linkX" error={errors.linkX}>
          <input id="linkX" name="linkX" defaultValue={initial("linkX")} className={inputClass} />
        </Field>

        <Field label="LinkedIn" name="linkLinkedin" error={errors.linkLinkedin}>
          <input
            id="linkLinkedin"
            name="linkLinkedin"
            defaultValue={initial("linkLinkedin")}
            className={inputClass}
          />
        </Field>

        <Field label="Website" name="linkWebsite" error={errors.linkWebsite}>
          <input
            id="linkWebsite"
            name="linkWebsite"
            defaultValue={initial("linkWebsite")}
            className={inputClass}
          />
        </Field>
      </Fieldset>

      <SubmitRow
        label={isEdit ? "Save changes" : "Create author"}
        cancelHref="/admin/authors"
        pending={isPending}
      />
    </form>
  );
}
