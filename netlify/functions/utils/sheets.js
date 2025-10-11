import { google } from "googleapis";

export function getAuth() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.JWT(
    creds.client_email,
    null,
    creds.private_key,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
}

export function getSheetsClient(auth) {
  return google.sheets({ version: "v4", auth });
}

export function unitPrice() {
  const env = Number(process.env.UNIT_PRICE);
  return Number.isFinite(env) && env > 0 ? env : 12;
}

// Utility: format "Oct 2025"
export function monthSheetName(date = new Date()) {
  const m = date.toLocaleString("en-US", { month: "short" });
  const y = date.getFullYear();
  return `${m} ${y}`;
}
