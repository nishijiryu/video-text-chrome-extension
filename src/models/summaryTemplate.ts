// 总结提示词模板：默认内容、变量渲染与本地存储键

export const SUMMARY_TEMPLATE_STORAGE_KEY = "video_text_summary_template";

/**
 * 默认模板。变量用双花括号包裹，渲染时替换成任务内容；
 * 中文变量名与英文别名同时支持，写错或漏写变量时原文保持不动。
 */
export const DEFAULT_SUMMARY_TEMPLATE = [
  "你拿到的是自动语音转写文本，没有画面、字幕、语气和说话人信息，不要描述你看不到的内容。",
  "",
  "请总结下面这段视频/音频转写内容，按以下结构输出：",
  "",
  "1. 核心摘要",
  "   300 字以内，只讲结论，不加评价。",
  "",
  "2. 内容详细总结",
  "   按讲述顺序分段，保留关键数据、人名、术语与时间线。",
  "   转写明显有误且影响理解处就地标注①（编号与 3 的对照表一致，任何说明都在 3 中说明，不要影响内容详细总结的连续性）。",
  "   只标注影响理解的错误，最多 10 处；纯语气词、断句问题不标。",
  "",
  "3. 误识对照表：表格列出 编号 | 原文 | 校正 | 依据  | 置信度。依据只能是「上下文推断」「术语常识」「外部检索链接」之一，并写清具体理由",
  "",
  "4. 评价",
  "   先联网检索再评价：针对视频中的事实性主张核实 1-3 条关键信息，列出检索到的来源（标题 + 链接）；检索不到写「未找到独立来源」；没有联网能力就明确写「本次未联网核实」，不要凭视频单方面说法下结论。",
  "   评价分两层：事实准确性（有据可查的部分）、客观评价。",
  "",
  "标题：{{标题}}",
  "来源：{{来源}}",
  "",
  "转写内容：{{转写内容}}",
].join("\n");

export interface SummaryTemplateValues {
  title: string;
  url: string;
  transcript: string;
}

type SummaryTemplateVariable = keyof SummaryTemplateValues;

/** 每个变量可识别的写法，中文在前、英文别名在后 */
export const SUMMARY_TEMPLATE_PLACEHOLDERS: Record<
  SummaryTemplateVariable,
  readonly string[]
> = {
  title: ["{{标题}}", "{{title}}"],
  url: ["{{来源}}", "{{来源链接}}", "{{url}}", "{{link}}"],
  transcript: ["{{转写内容}}", "{{transcript}}"],
};

/** 编辑器里展示的可点击变量，顺序即插入顺序 */
export const SUMMARY_TEMPLATE_VARIABLES: ReadonlyArray<{
  key: SummaryTemplateVariable;
  token: string;
}> = [
  { key: "title", token: "{{标题}}" },
  { key: "url", token: "{{来源}}" },
  { key: "transcript", token: "{{转写内容}}" },
];

const VARIABLE_KEYS = Object.keys(
  SUMMARY_TEMPLATE_PLACEHOLDERS
) as SummaryTemplateVariable[];

/**
 * 用任务内容填充模板。使用函数式替换，避免转写文本里的 $& 之类的
 * 替换模式被当成特殊语法；未出现的变量保持原样。
 */
export const renderSummaryTemplate = (
  template: string,
  values: SummaryTemplateValues
): string => {
  return VARIABLE_KEYS.reduce((output, key) => {
    const value = values[key] ?? "";
    return SUMMARY_TEMPLATE_PLACEHOLDERS[key].reduce(
      (acc, token) => acc.split(token).join(value),
      output
    );
  }, template);
};

/** 模板里是否有转写内容变量：没有它，总结拿不到原文 */
export const hasTranscriptPlaceholder = (template: string): boolean => {
  return SUMMARY_TEMPLATE_PLACEHOLDERS.transcript.some((token) =>
    template.includes(token)
  );
};

/** 模板可用于保存/渲染的最低要求：非空且包含转写内容变量 */
export const isValidSummaryTemplate = (template: string): boolean => {
  return template.trim().length > 0 && hasTranscriptPlaceholder(template);
};

/** 读取本地保存的模板，非法或不存在的值回退到默认模板 */
export const loadSummaryTemplate = (): string => {
  try {
    const stored = window.localStorage.getItem(SUMMARY_TEMPLATE_STORAGE_KEY);
    return stored && isValidSummaryTemplate(stored)
      ? stored
      : DEFAULT_SUMMARY_TEMPLATE;
  } catch {
    return DEFAULT_SUMMARY_TEMPLATE;
  }
};

/** 保存模板到本地，失败时静默忽略（隐私模式等场景） */
export const persistSummaryTemplate = (template: string): void => {
  try {
    window.localStorage.setItem(SUMMARY_TEMPLATE_STORAGE_KEY, template);
  } catch {
    // localStorage not available
  }
};
