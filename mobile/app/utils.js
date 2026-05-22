import { SERVER_BASE } from "./api/api";

export function fixUrl(url) {
    if (!url) return null;
    return url
        .replace(/https?:\/\/localhost(:\d+)?/, SERVER_BASE)
        .replace(/https?:\/\/127\.0\.0\.1(:\d+)?/, SERVER_BASE);
}
