"use client";

import { CHEKIOButton, CHEKIOInput, CHEKIOModal } from "@/components";
import type { SubOrganizationalUnitListItemDto } from "@/dto/structure";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateSubOrganizationalUnit,
  useUpdateSubOrganizationalUnit,
} from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { ParentSubUnitPicker } from "./ParentSubUnitPicker";

enum ButtonVariant {
  Primary = "primary",
  SecondaryBlue = "secondaryBlue",
}

interface FormValues {
  name: string;
  code: string;
  parentSubUnitIds: string[];
}

interface SubUnitModalByLevelProps {
  isOpen: boolean;
  onClose: () => void;
  structureId: string;
  level: number;
  levelOuPublicId: string;
  validParents: SubOrganizationalUnitListItemDto[];
  editingSubUnitId: string | null;
  editingSubUnit: SubOrganizationalUnitListItemDto | null;
  onSuccess: () => void;
  isPending?: boolean;
  /** When creating, pre-select parents (e.g. from URL ?parent=) if present in validParents */
  initialParentSubUnitIds?: string[];
}

export function SubUnitModalByLevel({
  isOpen,
  onClose,
  structureId,
  level,
  levelOuPublicId,
  validParents,
  editingSubUnitId,
  editingSubUnit,
  onSuccess,
  isPending: isPendingProp,
  initialParentSubUnitIds,
}: SubUnitModalByLevelProps) {
  const t = useTranslations("mantainers.structures");
  const tLevel = useTranslations("mantainers.structures.levelDetail");
  const { toast } = useToast();
  const { control, handleSubmit, reset, setValue, getValues } =
    useForm<FormValues>({
      defaultValues: {
        name: "",
        code: "",
        parentSubUnitIds: [],
      },
    });

  const wasOpenRef = useRef(false);

  const { mutate: createSubUnit, isPending: isCreating } =
    useCreateSubOrganizationalUnit();
  const { mutate: updateSubUnit, isPending: isUpdating } =
    useUpdateSubOrganizationalUnit();
  const busy =
    isPendingProp !== undefined ? isPendingProp : isCreating || isUpdating;

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;

    if (editingSubUnit) {
      setValue("name", editingSubUnit.name);
      setValue("code", editingSubUnit.code);
      const ids =
        editingSubUnit.parentSubUnitIds &&
        editingSubUnit.parentSubUnitIds.length > 0
          ? editingSubUnit.parentSubUnitIds
          : editingSubUnit.subRelationId
            ? [editingSubUnit.subRelationId]
            : [];
      setValue("parentSubUnitIds", ids);
      return;
    }

    if (justOpened) {
      const prefill = (initialParentSubUnitIds ?? []).filter((id) =>
        validParents.some((p) => p.publicId === id),
      );
      reset({ name: "", code: "", parentSubUnitIds: prefill });
      return;
    }

    if (
      !editingSubUnitId &&
      validParents.length > 0 &&
      (initialParentSubUnitIds?.length ?? 0) > 0
    ) {
      const prefill = (initialParentSubUnitIds ?? []).filter((id) =>
        validParents.some((p) => p.publicId === id),
      );
      const cur = getValues("parentSubUnitIds");
      const nameEmpty = !getValues("name")?.trim();
      const codeEmpty = !getValues("code")?.trim();
      if (cur.length === 0 && prefill.length > 0 && nameEmpty && codeEmpty) {
        setValue("parentSubUnitIds", prefill);
      }
    }
  }, [
    isOpen,
    editingSubUnit,
    editingSubUnitId,
    initialParentSubUnitIds,
    validParents,
    reset,
    setValue,
    getValues,
  ]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: FormValues) => {
    const parentPayload =
      level >= 2 ? (data.parentSubUnitIds ?? []).filter(Boolean) : undefined;
    if (editingSubUnitId) {
      updateSubUnit(
        {
          structureId,
          subUnitPublicId: editingSubUnitId,
          body: {
            name: data.name.trim(),
            code: data.code.trim(),
            ...(level >= 2 && { parentSubUnitIds: parentPayload ?? [] }),
          },
        },
        {
          onSuccess: () => onSuccess(),
          onError: (error: unknown) => handleError(error, toast),
        },
      );
    } else {
      createSubUnit(
        {
          name: data.name.trim(),
          code: data.code.trim(),
          organizationalUnitId: levelOuPublicId,
          ...(level >= 2 && {
            parentSubUnitIds: parentPayload ?? [],
          }),
        },
        {
          onSuccess: () => onSuccess(),
          onError: (error: unknown) => handleError(error, toast),
        },
      );
    }
  };

  const isEdit = !!editingSubUnitId;

  const parentRules =
    level >= 2 && validParents.length > 0
      ? {
          validate: (v: string[]) =>
            (v?.length ?? 0) > 0 ? true : tLevel("validationParentsRequired"),
        }
      : undefined;

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? tLevel("editSubunit") : tLevel("newSubunit")}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <label
            htmlFor="subunit-name"
            className="text-sm font-medium text-gray-700 block"
          >
            {tLevel("name")}
          </label>
          <Controller
            name="name"
            control={control}
            rules={{ required: tLevel("validationNameRequired") }}
            render={({ field, fieldState }) => (
              <>
                <CHEKIOInput
                  {...field}
                  id="subunit-name"
                  placeholder={tLevel("namePlaceholder")}
                  className={fieldState.error ? "border-red-500" : ""}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-500">
                    {fieldState.error.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <label
            htmlFor="subunit-code"
            className="text-sm font-medium text-gray-700 block"
          >
            {tLevel("code")}
          </label>
          <Controller
            name="code"
            control={control}
            rules={{ required: tLevel("validationCodeRequired") }}
            render={({ field, fieldState }) => (
              <>
                <CHEKIOInput
                  {...field}
                  id="subunit-code"
                  placeholder={tLevel("codePlaceholder")}
                  className={fieldState.error ? "border-red-500" : ""}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-500">
                    {fieldState.error.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
        {level >= 2 && validParents.length > 0 && (
          <div className="grid w-full items-center gap-1.5">
            <label className="text-sm font-medium text-gray-700 block">
              {tLevel("parents")}
            </label>
            <Controller
              name="parentSubUnitIds"
              control={control}
              rules={parentRules}
              render={({ field, fieldState }) => (
                <ParentSubUnitPicker
                  key={isOpen ? (editingSubUnitId ?? "create") : "closed"}
                  parents={validParents}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  disabled={busy}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <CHEKIOButton
            type="button"
            variant={ButtonVariant.SecondaryBlue}
            onClick={handleClose}
            disabled={busy}
          >
            {t("buttons.cancel")}
          </CHEKIOButton>
          <CHEKIOButton
            type="submit"
            variant={ButtonVariant.Primary}
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? tLevel("saving") : tLevel("creating")}
              </>
            ) : isEdit ? (
              tLevel("save")
            ) : (
              tLevel("create")
            )}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
}
