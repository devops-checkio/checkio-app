"use client";

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Highlighter,
  Indent,
  Italic,
  Link,
  List,
  ListOrdered,
  Outdent,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CHEKIORichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
}

export default function CHEKIORichTextEditor({
  value,
  onChange,
  placeholder = "Escriba su texto aquí...",
  minHeight = "200px",
  disabled = false,
}: CHEKIORichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sincronizar el contenido del editor con el valor externo
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const isCommandActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  const buttonClass = (command: string) => {
    const isActive = isCommandActive(command);
    return `p-2 rounded hover:bg-gray-200 transition-colors ${
      isActive ? "bg-blue-100 text-blue-600" : "text-gray-700"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`;
  };

  return (
    <div
      className={`border rounded ${
        isFocused ? "border-gray-900 ring-1 ring-gray-900" : "border-gray-300"
      } ${disabled ? "bg-gray-100 opacity-60" : "bg-white"}`}
    >
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Formato de texto */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => execCommand("bold")}
            className={buttonClass("bold")}
            title="Negrita (Ctrl+B)"
            disabled={disabled}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("italic")}
            className={buttonClass("italic")}
            title="Cursiva (Ctrl+I)"
            disabled={disabled}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("underline")}
            className={buttonClass("underline")}
            title="Subrayado (Ctrl+U)"
            disabled={disabled}
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("strikeThrough")}
            className={buttonClass("strikeThrough")}
            title="Tachado"
            disabled={disabled}
          >
            <Strikethrough className="h-4 w-4" />
          </button>
        </div>

        {/* Superíndice y Subíndice */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => execCommand("superscript")}
            className={buttonClass("superscript")}
            title="Superíndice (x²)"
            disabled={disabled}
          >
            <Superscript className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("subscript")}
            className={buttonClass("subscript")}
            title="Subíndice (H₂O)"
            disabled={disabled}
          >
            <Subscript className="h-4 w-4" />
          </button>
        </div>

        {/* Alineación */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => execCommand("justifyLeft")}
            className={buttonClass("justifyLeft")}
            title="Alinear a la izquierda"
            disabled={disabled}
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("justifyCenter")}
            className={buttonClass("justifyCenter")}
            title="Centrar"
            disabled={disabled}
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("justifyRight")}
            className={buttonClass("justifyRight")}
            title="Alinear a la derecha"
            disabled={disabled}
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("justifyFull")}
            className={buttonClass("justifyFull")}
            title="Justificar"
            disabled={disabled}
          >
            <AlignJustify className="h-4 w-4" />
          </button>
        </div>

        {/* Listas */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => execCommand("insertUnorderedList")}
            className={buttonClass("insertUnorderedList")}
            title="Lista con viñetas"
            disabled={disabled}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("insertOrderedList")}
            className={buttonClass("insertOrderedList")}
            title="Lista numerada"
            disabled={disabled}
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>

        {/* Indentación */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => execCommand("indent")}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-black"
            title="Aumentar sangría"
            disabled={disabled}
          >
            <Indent className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("outdent")}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-black"
            title="Disminuir sangría"
            disabled={disabled}
          >
            <Outdent className="h-4 w-4" />
          </button>
        </div>

        {/* Estilos de encabezado */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <select
            onChange={(e) => {
              const value = e.target.value;
              if (value === "p") {
                execCommand("formatBlock", "<p>");
              } else {
                execCommand("formatBlock", `<${value}>`);
              }
            }}
            className="text-sm border text-black border-gray-300 rounded px-3 py-1.5 cursor-pointer hover:bg-gray-100 bg-white min-w-[130px]"
            disabled={disabled}
            defaultValue="p"
          >
            <option value="p">Normal</option>
            <option value="h1">Título 1 (H1)</option>
            <option value="h2">Título 2 (H2)</option>
            <option value="h3">Título 3 (H3)</option>
            <option value="h4">Título 4 (H4)</option>
            <option value="h5">Título 5 (H5)</option>
          </select>
        </div>

        {/* Tamaño de fuente */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <select
            onChange={(e) => execCommand("fontSize", e.target.value)}
            className="text-sm border text-black border-gray-300 rounded px-3 py-1.5 cursor-pointer hover:bg-gray-100 bg-white min-w-[120px]"
            disabled={disabled}
            defaultValue="3"
          >
            <option value="1">Muy pequeño</option>
            <option value="2">Pequeño</option>
            <option value="3">Normal</option>
            <option value="4">Mediano</option>
            <option value="5">Grande</option>
            <option value="6">Muy grande</option>
            <option value="7">Enorme</option>
          </select>
        </div>

        {/* Tipo de fuente */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <select
            onChange={(e) => execCommand("fontName", e.target.value)}
            className="text-sm border text-black border-gray-300 rounded px-3 py-1.5 cursor-pointer hover:bg-gray-100 bg-white min-w-[140px]"
            disabled={disabled}
            defaultValue="Arial"
          >
            <option value="Arial" style={{ fontFamily: "Arial" }}>
              Arial
            </option>
            <option
              value="Times New Roman"
              style={{ fontFamily: "Times New Roman" }}
            >
              Times New Roman
            </option>
            <option value="Courier New" style={{ fontFamily: "Courier New" }}>
              Courier New
            </option>
            <option value="Georgia" style={{ fontFamily: "Georgia" }}>
              Georgia
            </option>
            <option value="Verdana" style={{ fontFamily: "Verdana" }}>
              Verdana
            </option>
            <option
              value="Comic Sans MS"
              style={{ fontFamily: "Comic Sans MS" }}
            >
              Comic Sans MS
            </option>
            <option value="Impact" style={{ fontFamily: "Impact" }}>
              Impact
            </option>
            <option value="Trebuchet MS" style={{ fontFamily: "Trebuchet MS" }}>
              Trebuchet MS
            </option>
          </select>
        </div>

        {/* Colores */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] text-gray-500 text-center">
              Texto
            </label>
            <input
              type="color"
              onChange={(e) => execCommand("foreColor", e.target.value)}
              className="h-6 w-10 border border-gray-300 rounded cursor-pointer"
              title="Color de texto"
              disabled={disabled}
              defaultValue="#000000"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] text-gray-500 text-center">
              Fondo
            </label>
            <input
              type="color"
              onChange={(e) => execCommand("backColor", e.target.value)}
              className="h-6 w-10 border border-gray-300 rounded cursor-pointer"
              title="Color de fondo (resaltado)"
              disabled={disabled}
              defaultValue="#FFFF00"
            />
          </div>
        </div>

        {/* Utilidades */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              execCommand("removeFormat");
              execCommand("unlink");
            }}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
            title="Limpiar formato"
            disabled={disabled}
          >
            <Eraser className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const url = prompt("Ingresa la URL:");
              if (url) {
                execCommand("createLink", url);
              }
            }}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
            title="Insertar enlace"
            disabled={disabled}
          >
            <Link className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("insertHorizontalRule")}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
            title="Insertar línea horizontal"
            disabled={disabled}
          >
            <Highlighter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`p-4 outline-none overflow-auto rbk-rich-text-editor ${
          disabled ? "cursor-not-allowed" : ""
        }`}
        style={{
          minHeight,
          lineHeight: "1.6",
          fontSize: "14px",
          color: "#000000",
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .rbk-rich-text-editor {
            line-height: 1.6;
            font-size: 14px;
            color: #000000;
          }
          .rbk-rich-text-editor:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          .rbk-rich-text-editor p {
            margin-bottom: 0.5em;
            line-height: 1.6;
            color: #000000;
          }
          .rbk-rich-text-editor ul, .rbk-rich-text-editor ol {
            margin: 0.5em 0;
            padding-left: 2em;
            line-height: 1.6;
            color: #000000;
          }
          .rbk-rich-text-editor li {
            margin-bottom: 0.25em;
            color: #000000;
          }
          .rbk-rich-text-editor h1 {
            font-size: 2em;
            font-weight: 700;
            margin: 0.67em 0;
            line-height: 1.2;
            color: #000000;
          }
          .rbk-rich-text-editor h2 {
            font-size: 1.5em;
            font-weight: 700;
            margin: 0.75em 0;
            line-height: 1.3;
            color: #000000;
          }
          .rbk-rich-text-editor h3 {
            font-size: 1.25em;
            font-weight: 600;
            margin: 0.83em 0;
            line-height: 1.4;
            color: #000000;
          }
          .rbk-rich-text-editor h4 {
            font-size: 1.1em;
            font-weight: 600;
            margin: 1em 0;
            line-height: 1.4;
            color: #000000;
          }
          .rbk-rich-text-editor h5 {
            font-size: 1em;
            font-weight: 600;
            margin: 1em 0;
            line-height: 1.4;
            color: #000000;
          }
          .rbk-rich-text-editor span,
          .rbk-rich-text-editor div {
            color: inherit;
          }
          .rbk-rich-text-editor a {
            color: #2563eb;
            text-decoration: underline;
          }
          .rbk-rich-text-editor a:hover {
            color: #1d4ed8;
          }
          .rbk-rich-text-editor hr {
            border: 0;
            border-top: 2px solid #d1d5db;
            margin: 1em 0;
          }
        `,
        }}
      />
    </div>
  );
}
