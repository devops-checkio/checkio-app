"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import EmployeeBulkUpload from "../_components/employee-bulk-upload";

export default function EmployeeBulkUploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("mantainers.employees");

  const handleSuccess = () => {
    toast({
      title: t("toast.bulkSuccess.title"),
      description: t("toast.bulkSuccess.description"),
    });
    // Redirigir a la página de empleados después de un breve delay
    setTimeout(() => {
      router.push("/mantainers/employees");
    }, 2000);
  };

  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.EMPLOYEE_MAINTENANCE
      }
    >
      <>
        <EmployeeBulkUpload onSuccess={handleSuccess} />
      </>
    </AccessNotGranted>
  );
}
