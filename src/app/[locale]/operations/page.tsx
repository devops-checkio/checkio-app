"use client";

import TitleHeader from "@/components/ui/title";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  QrcodeOutlined,
  SafetyOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Card, Typography } from "antd";
import Link from "next/link";

const { Title } = Typography;

export default function OperationsPage() {
  const modules = [
    {
      title: "Turnos",
      description: "Administración de turnos y horarios",
      link: "/operations/shift",
      icon: <ClockCircleOutlined className="text-4xl text-blue-500" />,
    },
    {
      title: "Programación",
      description: "Programación de horarios y turnos",
      link: "/operations/schedule",
      icon: <CalendarOutlined className="text-4xl text-green-500" />,
    },
    {
      title: "Horario por Equipo",
      description: "Vista de horarios de múltiples empleados",
      link: "/operations/team-schedule",
      icon: <TeamOutlined className="text-4xl text-indigo-500" />,
    },
    {
      title: "Ausencias",
      description: "Administración de ausentismo",
      link: "/operations/absences",
      icon: <MedicineBoxOutlined className="text-4xl text-red-500" />,
    },
    {
      title: "Pases Diarios",
      description: "Gestión de pases temporales de acceso",
      link: "/operations/daily-passes",
      icon: <QrcodeOutlined className="text-4xl text-purple-500" />,
    },
    {
      title: "Auditoría",
      description: "Logs de auditoría y seguimiento del sistema",
      link: "/operations/audit",
      icon: <SafetyOutlined className="text-4xl text-orange-500" />,
    },
  ];

  return (
    <>
      <TitleHeader
        title="Operaciones"
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { label: "Operaciones" },
        ]}
        onBack={() => window.history.back()}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {modules.map((module, index) => (
          <Link href={module.link} key={index}>
            <Card
              hoverable
              className="h-full transition-all hover:shadow-lg hover:border-blue-500"
            >
              <div className="flex flex-col items-center text-center p-4 gap-4">
                <div>{module.icon}</div>
                <div>
                  <Title level={4} className="mb-2">
                    {module.title}
                  </Title>
                  <p className="text-gray-500">{module.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
