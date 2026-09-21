export type ChatModelId =
  | "chatgpt"
  | "gemini"
  | "claude"
  | "deepseek"
  | "kimi"
  | "qwen"
  | "doubao";

export interface ChatModel {
  id: ChatModelId;
  /** 品牌名，跨语言不翻译 */
  name: string;
  /** i18n key，用于下拉选项文案 */
  labelKey: string;
  /** 没有已开标签页时打开的对话页 */
  chatUrl: string;
  /** chrome.tabs.query 使用的 match pattern，需要对应的 host_permissions */
  urlPattern: string;
}

export const CHAT_MODELS: ChatModel[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    labelKey: "models.chatgpt",
    chatUrl: "https://chatgpt.com/",
    urlPattern: "https://chatgpt.com/*",
  },
  {
    id: "gemini",
    name: "Gemini",
    labelKey: "models.gemini",
    chatUrl: "https://gemini.google.com/app",
    urlPattern: "https://gemini.google.com/*",
  },
  {
    id: "claude",
    name: "Claude",
    labelKey: "models.claude",
    chatUrl: "https://claude.ai/new",
    urlPattern: "https://claude.ai/*",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    labelKey: "models.deepseek",
    chatUrl: "https://chat.deepseek.com/",
    urlPattern: "https://chat.deepseek.com/*",
  },
  {
    id: "kimi",
    name: "Kimi",
    labelKey: "models.kimi",
    chatUrl: "https://www.kimi.com/",
    urlPattern: "https://*.kimi.com/*",
  },
  {
    id: "qwen",
    name: "通义千问",
    labelKey: "models.qwen",
    chatUrl: "https://www.tongyi.com/qianwen/",
    urlPattern: "https://*.tongyi.com/*",
  },
  {
    id: "doubao",
    name: "豆包",
    labelKey: "models.doubao",
    chatUrl: "https://www.doubao.com/chat/",
    urlPattern: "https://*.doubao.com/*",
  },
];

export const DEFAULT_CHAT_MODEL_ID: ChatModelId = "chatgpt";

export const CHAT_MODEL_STORAGE_KEY = "video_text_chat_model";

/** 命中则返回对应模型，未命中（含脏数据）回退到默认模型 */
export function getChatModel(id: string | null | undefined): ChatModel {
  const matched = CHAT_MODELS.find((model) => model.id === id);
  if (matched) return matched;
  return CHAT_MODELS.find(
    (model) => model.id === DEFAULT_CHAT_MODEL_ID
  ) as ChatModel;
}

export function isChatModelId(value: unknown): value is ChatModelId {
  return (
    typeof value === "string" &&
    CHAT_MODELS.some((model) => model.id === value)
  );
}
