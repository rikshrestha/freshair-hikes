import {
  documentDirectory,
  EncodingType,
  readAsStringAsync,
  writeAsStringAsync,
} from "expo-file-system";

const LOG_FILE = `${documentDirectory ?? ""}freshair.log`;

export async function logEvent(message: string) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${message}\n`;
  try {
    if (!documentDirectory) {
      console.log(line.trim());
      return;
    }
    const existing = await readAsStringAsync(LOG_FILE, { encoding: EncodingType.UTF8 }).catch(
      () => ""
    );
    await writeAsStringAsync(LOG_FILE, `${existing}${line}`, { encoding: EncodingType.UTF8 });
  } catch (err) {
    console.warn("logEvent failed", err);
    console.log(line.trim());
  }
}

export async function readLog(): Promise<string> {
  if (!documentDirectory) return "";
  try {
    return await readAsStringAsync(LOG_FILE, { encoding: EncodingType.UTF8 });
  } catch {
    return "";
  }
}
