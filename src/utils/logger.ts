import * as FileSystem from "expo-file-system";

const LOG_FILE = `${FileSystem.documentDirectory ?? ""}freshair.log`;

export async function logEvent(message: string) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${message}\n`;
  try {
    if (!FileSystem.documentDirectory) {
      console.log(line.trim());
      return;
    }
    await FileSystem.writeAsStringAsync(LOG_FILE, line, { encoding: FileSystem.EncodingType.UTF8, append: true });
  } catch (err) {
    console.warn("logEvent failed", err);
    console.log(line.trim());
  }
}

export async function readLog(): Promise<string> {
  if (!FileSystem.documentDirectory) return "";
  try {
    return await FileSystem.readAsStringAsync(LOG_FILE, { encoding: FileSystem.EncodingType.UTF8 });
  } catch {
    return "";
  }
}
