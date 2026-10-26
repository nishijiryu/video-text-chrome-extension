import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowCounterClockwise,
  Eye,
  EyeSlash,
  TextAa,
  X,
} from "phosphor-react";
import {
  DEFAULT_SUMMARY_TEMPLATE,
  SUMMARY_TEMPLATE_VARIABLES,
  hasTranscriptPlaceholder,
  renderSummaryTemplate,
} from "../models/summaryTemplate";

interface TemplateModalProps {
  isOpen: boolean;
  value: string;
  onClose: () => void;
  onSave: (value: string) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  value,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(value);
      setShowPreview(false);
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
          const textarea = textareaRef.current;
          if (textarea) {
            textarea.focus();
            const end = textarea.value.length;
            textarea.setSelectionRange(end, end);
          }
        });
      });
      document.body.style.overflow = "hidden";
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = "";
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const insertVariable = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setDraft((prev) => prev + token);
      return;
    }
    const start = textarea.selectionStart ?? draft.length;
    const end = textarea.selectionEnd ?? start;
    setDraft(draft.slice(0, start) + token + draft.slice(end));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const trimmed = draft.trim();
  const missingTranscript = !hasTranscriptPlaceholder(draft);
  const canSave = trimmed.length > 0 && !missingTranscript;
  const error = trimmed.length === 0
    ? t("template.errorEmpty")
    : missingTranscript
      ? t("template.errorMissingTranscript", { variable: "{{转写内容}}" })
      : "";

  const previewText = renderSummaryTemplate(draft, {
    title: t("template.preview.titleValue"),
    url: t("template.preview.urlValue"),
    transcript: t("template.preview.transcriptValue"),
  });

  const handleSave = () => {
    if (!canSave) return;
    onSave(draft);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`confirm-modal-overlay ${isAnimating ? "confirm-modal-overlay-active" : ""}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
    >
      <div
        className={`confirm-modal-container template-modal-container select-text ${
          isAnimating ? "confirm-modal-container-active" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
            <TextAa size={20} weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="template-modal-title"
              className="text-base font-bold text-slate-900"
            >
              {t("template.title")}
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              {t("template.description")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("template.cancel")}
            className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("template.placeholder")}
          aria-label={t("template.title")}
          spellCheck={false}
          className="min-h-[150px] w-full flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 font-mono text-[12px] leading-relaxed text-slate-700 outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
        />

        <div className="flex flex-wrap items-center gap-1.5">
          {SUMMARY_TEMPLATE_VARIABLES.map((variable) => (
            <button
              key={variable.key}
              type="button"
              onClick={() => insertVariable(variable.token)}
              className="rounded-lg border border-indigo-100 bg-indigo-50/70 px-2 py-1 text-[11px] font-semibold text-indigo-600 transition-all hover:border-indigo-200 hover:bg-indigo-100"
            >
              {t(`template.variables.${variable.key}`)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
          >
            {showPreview ? <EyeSlash size={13} /> : <Eye size={13} />}
            <span>{showPreview ? t("template.hidePreview") : t("template.showPreview")}</span>
          </button>
        </div>

        {showPreview && (
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-dashed border-slate-200 bg-white p-3 font-mono text-[11px] leading-relaxed text-slate-600">
            {previewText}
          </pre>
        )}

        {error && (
          <p className="text-[11px] font-semibold text-rose-500">{error}</p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_SUMMARY_TEMPLATE)}
            className="flex items-center gap-1 rounded-xl px-2.5 py-2 text-[11px] font-semibold text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
          >
            <ArrowCounterClockwise size={13} />
            <span>{t("template.restoreDefault")}</span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-500 transition-all hover:bg-slate-200/80 hover:text-slate-700"
            >
              {t("template.cancel")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="rounded-xl bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("template.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
