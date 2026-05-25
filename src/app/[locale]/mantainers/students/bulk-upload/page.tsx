"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import StudentBulkUpload from "../_components/student-bulk-upload";

export default function StudentBulkUploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("mantainers.students");

  const handleSuccess = () => {
    toast({
      title: t("toast.bulkSuccess.title"),
      description: t("toast.bulkSuccess.description"),
    });
    setTimeout(() => {
      router.push("/mantainers/students");
    }, 2000);
  };

  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.STUDENT_MAINTENANCE}
    >
      <StudentBulkUpload onSuccess={handleSuccess} />
    </AccessNotGranted>
  );
}
