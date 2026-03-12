import React, { useState, useId } from "react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { cn } from "../../../utils/cn";

/*──────────────────────────────────────────────────────────────
  UniversalInput — polymorphic, accessible input component
  ──────────────────────────────────────────────────────────────

  USAGE EXAMPLES
  ──────────────
  ① Plain text
     <UniversalInput label="Nome" name="nome" value={v} onChange={fn} required />

  ② Password (built-in show/hide toggle)
     <UniversalInput label="Senha" type="password" value={v} onChange={fn} />

  ③ Select
     <UniversalInput
       as="select"
       label="Contrato"
       options={[{ value: "CLT", label: "CLT" }, { value: "PJ", label: "PJ" }]}
       value={v} onChange={fn}
     />

  ④ Textarea
     <UniversalInput as="textarea" label="Observações" rows={4} value={v} onChange={fn} />

  ⑤ Checkbox / toggle switch
     <UniversalInput as="checkbox" label="Ativo" checked={v} onChange={fn} />
     <UniversalInput as="toggle"  label="Status" checked={v} onChange={fn} />

  ⑥ With icons
     <UniversalInput label="Email" startIcon={<Mail />} value={v} onChange={fn} />

  ⑦ react-hook-form
     <UniversalInput label="Email" registration={register("email")} error={errors.email} />

  ⑧ Custom render (e.g. IMaskInput)
     <UniversalInput label="Telefone" error={err}>
       <IMaskInput mask="(00) 00000-0000" ... />
     </UniversalInput>

  ⑨ Search variant
     <UniversalInput variant="search" startIcon={<Search />} placeholder="Buscar..." />

  ⑩ Auth / underline variant
     <UniversalInput variant="underline" startIcon={<Lock />} type="password" />

  PROPS REFERENCE
  ───────────────
  as           — "input" | "textarea" | "select" | "checkbox" | "toggle"   (default: "input")
  variant      — "default" | "search" | "underline"                        (default: "default")
  type         — HTML input type: text, email, password, number, date, time, etc.
  label        — Label text (string)
  hint         — Helper text below the input
  error        — Error message (string) or RHF error object ({ message })
  required     — Show * asterisk after label & set aria-required
  disabled     — Disables the field
  readOnly     — Makes the field read-only (grayed bg)
  startIcon    — ReactNode rendered to the left
  endIcon      — ReactNode rendered to the right
  options      — [{ value, label }] — only used when as="select"
  placeholder  — Placeholder for select first empty option (as="select") or standard input
  registration — Spread from react-hook-form register("field")
  children     — Custom element rendered INSTEAD of the native input (for IMaskInput, etc.)
  className    — Extra classes merged onto the input element
  wrapperClassName — Extra classes merged onto the outermost wrapper
  All other HTML attributes are forwarded via ...rest.
────────────────────────────────────────────────────────────── */
const UniversalInput = React.forwardRef(
  (
    {
      as = "input",
      variant = "default",
      type = "text",
      label,
      hint,
      error,
      required = false,
      disabled = false,
      readOnly = false,
      startIcon,
      endIcon,
      options = [],
      placeholder,
      registration,
      children,
      className,
      wrapperClassName,
      id: externalId,
      ...rest
    },
    ref,
  ) => {
    // ── IDs & ARIA ──────────────────────────────────────────
    const autoId = useId();
    const inputId = externalId || autoId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    // Normalise error — accept string or { message } from react-hook-form
    const errorMessage =
      typeof error === "string"
        ? error
        : error?.message
          ? error.message
          : null;

    // ── Password visibility toggle ──────────────────────────
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const resolvedType = isPassword && showPassword ? "text" : type;

    // ── Shared props applied to every field element ─────────
    const sharedProps = {
      id: inputId,
      ref,
      disabled,
      readOnly,
      "aria-invalid": !!errorMessage || undefined,
      "aria-describedby":
        [errorMessage && errorId, hint && hintId].filter(Boolean).join(" ") ||
        undefined,
      "aria-required": required || undefined,
      ...(registration || {}),
      ...rest,
    };

    // ── Base classes per variant ─────────────────────────────
    const baseDefault = cn(
      "w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-900",
      "placeholder-gray-400 transition-all duration-150",
      "focus:outline-none focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7]",
      "disabled:opacity-60 disabled:cursor-not-allowed",
      readOnly && "bg-gray-100 cursor-default",
      errorMessage && "border-red-400 focus:ring-red-400 focus:border-red-400",
    );

    const baseSearch = cn(
      "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900",
      "placeholder-gray-400 transition-all duration-150",
      "focus:outline-none focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7]",
    );

    const baseUnderline = cn(
      "w-full bg-transparent text-lg py-3 placeholder-[#9ca3af] text-[#111827]",
      "focus:outline-none transition-all",
    );

    const variantClasses =
      variant === "search"
        ? baseSearch
        : variant === "underline"
          ? baseUnderline
          : baseDefault;

    // Adjust padding when icons are present (default variant only)
    const iconPadding =
      variant === "default"
        ? cn(startIcon && "pl-10", endIcon && !isPassword && "pr-10")
        : "";

    const inputClasses = cn(variantClasses, iconPadding, className);

    // ── Label ───────────────────────────────────────────────
    const renderLabel = () =>
      label ? (
        <label
          htmlFor={inputId}
          className={cn(
            "block text-sm font-medium text-gray-700 text-left",
            variant === "underline" && "text-[#6b7280]",
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      ) : null;

    // ── Error message ───────────────────────────────────────
    const renderError = () =>
      errorMessage ? (
        <p id={errorId} role="alert" className="text-sm text-red-500 mt-1">
          {errorMessage}
        </p>
      ) : null;

    // ── Hint ────────────────────────────────────────────────
    const renderHint = () =>
      hint && !errorMessage ? (
        <p id={hintId} className="text-xs text-gray-500 mt-1">
          {hint}
        </p>
      ) : null;

    // ── CHECKBOX ────────────────────────────────────────────
    if (as === "checkbox") {
      return (
        <div className={cn("flex items-center gap-2", wrapperClassName)}>
          <input
            type="checkbox"
            {...sharedProps}
            className={cn(
              "w-4 h-4 rounded border-gray-300 text-[#007EA7] focus:ring-[#007EA7] accent-[#007EA7] cursor-pointer",
              className,
            )}
          />
          {label && (
            <label
              htmlFor={inputId}
              className="text-sm text-gray-700 select-none cursor-pointer"
            >
              {label}
            </label>
          )}
          {renderError()}
        </div>
      );
    }

    // ── TOGGLE SWITCH ───────────────────────────────────────
    if (as === "toggle") {
      return (
        <div className={cn("flex items-center gap-3", wrapperClassName)}>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...sharedProps}
              className="sr-only peer"
            />
            <div
              className={cn(
                "w-11 h-6 bg-gray-200 rounded-full peer",
                "peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#007EA7]/30",
                "peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full",
                "peer-checked:after:border-white",
                "after:content-[''] after:absolute after:top-0.5 after:start-0.5",
                "after:bg-white after:border-gray-300 after:border after:rounded-full",
                "after:h-5 after:w-5 after:transition-all",
                "peer-checked:bg-[#007EA7]",
              )}
            />
          </label>
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {renderError()}
        </div>
      );
    }

    // ── SELECT ──────────────────────────────────────────────
    if (as === "select") {
      return (
        <div className={cn("flex flex-col gap-2", wrapperClassName)}>
          {renderLabel()}

          <div className="relative">
            <select
              {...sharedProps}
              className={cn(
                inputClasses,
                "appearance-none cursor-pointer pr-10",
              )}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {renderError()}
          {renderHint()}
        </div>
      );
    }

    // ── TEXTAREA ────────────────────────────────────────────
    if (as === "textarea") {
      return (
        <div className={cn("flex flex-col gap-2", wrapperClassName)}>
          {renderLabel()}
          <textarea
            {...sharedProps}
            className={cn(inputClasses, "resize-none")}
          />
          {renderError()}
          {renderHint()}
        </div>
      );
    }

    // ── INPUT (default) ─────────────────────────────────────
    // If children are provided, render them instead of a native <input>.
    // This enables IMaskInput or any other custom element.
    const renderField = () => {
      if (children) {
        // Clone child to inject shared props (id, aria-*, etc.)
        return React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child, {
                id: inputId,
                "aria-invalid": sharedProps["aria-invalid"],
                "aria-describedby": sharedProps["aria-describedby"],
                "aria-required": sharedProps["aria-required"],
                disabled,
                readOnly,
                className: cn(inputClasses, child.props.className),
              })
            : child,
        );
      }

      return (
        <input
          type={resolvedType}
          {...sharedProps}
          className={cn(inputClasses, isPassword && "pr-12")}
        />
      );
    };

    // ── Underline variant wrapper ───────────────────────────
    if (variant === "underline") {
      return (
        <div className={cn("flex flex-col gap-3", wrapperClassName)}>
          {renderLabel()}

          <div
            className={cn(
              "flex items-center gap-3 border-b-2 border-[#8a8e97] bg-transparent",
              "focus-within:border-[#007EA7] transition-all py-3",
              errorMessage && "border-red-400 focus-within:border-red-400",
            )}
          >
            {startIcon && (
              <span className="text-[#6b7280] flex-shrink-0">{startIcon}</span>
            )}

            {renderField()}

            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="text-[#6b7280] hover:text-[#111827] transition-colors cursor-pointer flex-shrink-0"
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            )}

            {!isPassword && endIcon && (
              <span className="text-[#6b7280] flex-shrink-0">{endIcon}</span>
            )}
          </div>

          {renderError()}
          {renderHint()}
        </div>
      );
    }

    // ── Default & search variant wrapper ────────────────────
    return (
      <div className={cn("flex flex-col gap-2", wrapperClassName)}>
        {renderLabel()}

        <div className="relative">
          {startIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {startIcon}
            </span>
          )}

          {renderField()}

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}

          {!isPassword && endIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {endIcon}
            </span>
          )}
        </div>

        {renderError()}
        {renderHint()}
      </div>
    );
  },
);

UniversalInput.displayName = "UniversalInput";
export default UniversalInput;
