import SystemMultiSelect from "@/components/ui/multi-select";
import { DeleteOutlined, DragOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
} from "antd";
import React, { useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { useForm } from "react-hook-form";

const { Option } = Select;

interface ColumnDefinition {
  id: string;
  name: string;
  type: string;
}

interface ReportConfiguration {
  name: string;
  columns: ColumnDefinition[];
  schedule: {
    frequency: "daily" | "weekly" | "monthly";
    time: string;
    days?: number[];
    dayOfMonth?: number;
  };
}

const predefinedColumns: ColumnDefinition[] = [
  { id: "shiftName", name: "Nombre del Turno", type: "text" },
  { id: "employeeDocument", name: "Número de Documento", type: "text" },
  { id: "employeeName", name: "Nombre del Trabajador", type: "text" },
  { id: "checkIn", name: "Hora de Entrada", type: "datetime" },
  { id: "checkOut", name: "Hora de Salida", type: "datetime" },
  { id: "status", name: "Estado", type: "text" },
  { id: "totalHours", name: "Horas Totales", type: "number" },
];

const mockData = [
  {
    shiftName: "Turno Matutino",
    employeeDocument: "12345678",
    employeeName: "Juan Pérez",
    checkIn: "08:00",
    checkOut: "16:00",
    status: "Presente",
    totalHours: 8,
  },
  {
    shiftName: "Turno Vespertino",
    employeeDocument: "87654321",
    employeeName: "María García",
    checkIn: "16:00",
    checkOut: "00:00",
    status: "Presente",
    totalHours: 8,
  },
];

interface ReportConfigurationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (config: ReportConfiguration) => void;
}

export const ReportConfigurationModal: React.FC<
  ReportConfigurationModalProps
> = ({ visible, onClose, onSave }) => {
  const [form] = Form.useForm();
  const [selectedColumns, setSelectedColumns] = useState<ColumnDefinition[]>(
    []
  );
  const [previewData, setPreviewData] = useState(mockData);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const { control } = useForm({
    defaultValues: {
      days: [],
    },
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(selectedColumns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedColumns(items);
  };

  const handleAddColumn = (columnId: string) => {
    const column = predefinedColumns.find((col) => col.id === columnId);
    if (column && !selectedColumns.find((col) => col.id === columnId)) {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const handleRemoveColumn = (columnId: string) => {
    setSelectedColumns(selectedColumns.filter((col) => col.id !== columnId));
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      const config: ReportConfiguration = {
        name: values.name,
        columns: selectedColumns,
        schedule: {
          frequency: values.frequency,
          time: values.time.format("HH:mm"),
          days: selectedDays,
          dayOfMonth: values.dayOfMonth,
        },
      };
      onSave(config);
    });
  };

  const dayOptions = [
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" },
    { value: 0, label: "Domingo" },
  ];

  const handleSelectAll = () => {
    const allValues = dayOptions.map((option) => option.value);
    setSelectedDays(allValues);
  };

  return (
    <Modal
      title="Configuración de Reportes"
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Guardar
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Nombre del Reporte"
          rules={[
            {
              required: true,
              message: "Por favor ingrese el nombre del reporte",
            },
          ]}
        >
          <Input placeholder="Ingrese el nombre del reporte" />
        </Form.Item>

        <Form.Item label="Columnas del Reporte">
          <Select
            placeholder="Seleccione una columna para agregar"
            style={{ width: "100%", marginBottom: 16 }}
            onChange={handleAddColumn}
          >
            {predefinedColumns.map((column) => (
              <Option key={column.id} value={column.id}>
                {column.name}
              </Option>
            ))}
          </Select>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="columns">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {selectedColumns.map((column, index) => (
                    <Draggable
                      key={column.id}
                      draggableId={column.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            padding: "8px",
                            margin: "4px 0",
                            backgroundColor: "#f5f5f5",
                            borderRadius: "4px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            ...provided.draggableProps.style,
                          }}
                        >
                          <Space>
                            <DragOutlined />
                            <span>{column.name}</span>
                          </Space>
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveColumn(column.id)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Form.Item>

        <Form.Item
          name="frequency"
          label="Frecuencia de Envío"
          rules={[
            { required: true, message: "Por favor seleccione la frecuencia" },
          ]}
        >
          <Select>
            <Option value="daily">Diario</Option>
            <Option value="weekly">Semanal</Option>
            <Option value="monthly">Mensual</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="time"
          label="Hora de Envío"
          rules={[{ required: true, message: "Por favor seleccione la hora" }]}
        >
          <DatePicker picker="time" format="HH:mm" />
        </Form.Item>

        <Form.Item
          name="days"
          label="Días de la Semana"
          rules={[{ required: true, message: "Por favor seleccione los días" }]}
        >
          <SystemMultiSelect
            control={control}
            label=""
            attribute="days"
            options={dayOptions}
            placeholder="Seleccione los días de la semana"
            showSelectAll={true}
            onSelectAll={handleSelectAll}
            searchable={true}
            showClear={true}
            maxItems={7}
            showError={false}
            onChange={(values) => setSelectedDays(values)}
          />
        </Form.Item>

        <Form.Item
          name="dayOfMonth"
          label="Día del Mes"
          rules={[{ required: true, message: "Por favor seleccione el día" }]}
        >
          <Select>
            {Array.from({ length: 31 }, (_, i) => (
              <Option key={i + 1} value={i + 1}>
                {i + 1}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>

      <div style={{ marginTop: 24 }}>
        <h3>Vista Previa</h3>
        <Table
          dataSource={previewData}
          columns={selectedColumns.map((col) => ({
            title: col.name,
            dataIndex: col.id,
            key: col.id,
          }))}
          pagination={false}
        />
      </div>
    </Modal>
  );
};
