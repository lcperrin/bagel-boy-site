
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/utils/sheets.js
import { google } from "googleapis";
function getAuth() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.JWT(
    creds.client_email,
    null,
    creds.private_key,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
}
function getSheetsClient(auth) {
  return google.sheets({ version: "v4", auth });
}
function unitPrice() {
  const env = Number(process.env.UNIT_PRICE);
  return Number.isFinite(env) && env > 0 ? env : 12;
}
function monthSheetName(date = /* @__PURE__ */ new Date()) {
  const m = date.toLocaleString("en-US", { month: "short" });
  const y = date.getFullYear();
  return `${m} ${y}`;
}

// netlify/functions/submit-order.js
var ORDERS_TAB = "Orders";
var HEADERS = [
  "Date",
  "Customer Name",
  "Phone",
  "Product",
  "Quantity",
  "Unit Price",
  "Total",
  "Order #",
  "Product Increment"
];
var submit_order_default = async (request) => {
  console.log("submit-order function invoked");
  console.log("Request method:", request.method);
  let body = {};
  try {
    if (request.method !== "POST") {
      console.log("Method not allowed");
      return new Response("Method Not Allowed", { status: 405 });
    }
    body = await request.json();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const product = String(body.product || "").trim();
    const qty = Number(body.qty);
    console.log("Parsed body:", { name, phone, product, qty });
    if (!name) {
      console.log("Validation failed: Name is required");
      return jsonResponse({ ok: false, error: "Name is required" }, 400);
    }
    if (!phone) {
      console.log("Validation failed: Phone is required");
      return jsonResponse({ ok: false, error: "Phone is required" }, 400);
    }
    if (!product) {
      console.log("Validation failed: Product is required");
      return jsonResponse({ ok: false, error: "Product is required" }, 400);
    }
    if (!(qty >= 1)) {
      console.log("Validation failed: Quantity must be \u2265 1");
      return jsonResponse({ ok: false, error: "Quantity must be \u2265 1" }, 400);
    }
    const auth = getAuth();
    const sheets = getSheetsClient(auth);
    const spreadsheetId = process.env.SHEET_ID;
    const nowISO = (/* @__PURE__ */ new Date()).toISOString();
    const unit = unitPrice();
    const total = unit * qty;
    console.log("Appending order row:", { nowISO, name, phone, product, qty, unit, total });
    await ensureOrdersTab(sheets, spreadsheetId);
    const nextOrder = await nextOrderNumber(sheets, spreadsheetId);
    console.log("Next order number:", nextOrder);
    const productInc = await nextProductIncrement(sheets, spreadsheetId, product);
    console.log("Product increment:", productInc);
    const row = [
      nowISO,
      name,
      phone,
      product,
      qty,
      unit,
      total,
      nextOrder,
      productInc
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${ORDERS_TAB}!A:I`,
      valueInputOption: "RAW",
      requestBody: { values: [row] }
    });
    const mName = monthSheetName(/* @__PURE__ */ new Date());
    await ensureMonthTab(sheets, spreadsheetId, mName);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${mName}!A:I`,
      valueInputOption: "RAW",
      requestBody: { values: [row] }
    });
    console.log("Order successfully appended");
    return jsonResponse({
      ok: true,
      orderNo: nextOrder,
      item: { product, qty, unit, total },
      customer: { name, phone },
      timestamp: nowISO
    });
  } catch (e) {
    console.error("Error in submit-order function:", e);
    return jsonResponse({ ok: false, error: String(e && e.message ? e.message : e) }, 500);
  }
  function jsonResponse(data, status = 200) {
    const body2 = JSON.stringify(data);
    console.log("Returning response:", body2);
    return new Response(body2, {
      status,
      headers: { "Content-Type": "application/json" }
    });
  }
  async function ensureOrdersTab(sheets, spreadsheetId) {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const exists = meta.data.sheets?.some((s) => s.properties?.title === ORDERS_TAB);
    if (exists) return;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: { properties: { title: ORDERS_TAB, gridProperties: { frozenRowCount: 1 } } }
        }]
      }
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${ORDERS_TAB}!A1:I1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADERS] }
    });
  }
  async function ensureMonthTab(sheets, spreadsheetId, title) {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const exists = meta.data.sheets?.some((s) => s.properties?.title === title);
    if (exists) return;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } }
        }]
      }
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${title}!A1:I1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADERS] }
    });
  }
  async function nextOrderNumber(sheets, spreadsheetId) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${ORDERS_TAB}!H2:H`
    });
    const rows = res.data.values || [];
    let max = 0;
    for (const [v] of rows) {
      const n = Number(v);
      if (Number.isFinite(n) && n > max) max = n;
    }
    return max + 1;
  }
  async function nextProductIncrement(sheets, spreadsheetId, product) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${ORDERS_TAB}!D2:D`
    });
    const rows = res.data.values || [];
    let count = 0;
    for (const [p] of rows) if (String(p).trim() === product) count++;
    return count + 1;
  }
};
export {
  submit_order_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvdXRpbHMvc2hlZXRzLmpzIiwgIm5ldGxpZnkvZnVuY3Rpb25zL3N1Ym1pdC1vcmRlci5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgZ29vZ2xlIH0gZnJvbSBcImdvb2dsZWFwaXNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEF1dGgoKSB7XG4gIGNvbnN0IGNyZWRzID0gSlNPTi5wYXJzZShwcm9jZXNzLmVudi5HT09HTEVfU0VSVklDRV9BQ0NPVU5UX0pTT04pO1xuICByZXR1cm4gbmV3IGdvb2dsZS5hdXRoLkpXVChcbiAgICBjcmVkcy5jbGllbnRfZW1haWwsXG4gICAgbnVsbCxcbiAgICBjcmVkcy5wcml2YXRlX2tleSxcbiAgICBbXCJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9hdXRoL3NwcmVhZHNoZWV0c1wiXVxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2hlZXRzQ2xpZW50KGF1dGgpIHtcbiAgcmV0dXJuIGdvb2dsZS5zaGVldHMoeyB2ZXJzaW9uOiBcInY0XCIsIGF1dGggfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bml0UHJpY2UoKSB7XG4gIGNvbnN0IGVudiA9IE51bWJlcihwcm9jZXNzLmVudi5VTklUX1BSSUNFKTtcbiAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZShlbnYpICYmIGVudiA+IDAgPyBlbnYgOiAxMjtcbn1cblxuLy8gVXRpbGl0eTogZm9ybWF0IFwiT2N0IDIwMjVcIlxuZXhwb3J0IGZ1bmN0aW9uIG1vbnRoU2hlZXROYW1lKGRhdGUgPSBuZXcgRGF0ZSgpKSB7XG4gIGNvbnN0IG0gPSBkYXRlLnRvTG9jYWxlU3RyaW5nKFwiZW4tVVNcIiwgeyBtb250aDogXCJzaG9ydFwiIH0pO1xuICBjb25zdCB5ID0gZGF0ZS5nZXRGdWxsWWVhcigpO1xuICByZXR1cm4gYCR7bX0gJHt5fWA7XG59XG4iLCAiXG5pbXBvcnQgeyBnZXRBdXRoLCBnZXRTaGVldHNDbGllbnQsIHVuaXRQcmljZSwgbW9udGhTaGVldE5hbWUgfSBmcm9tIFwiLi91dGlscy9zaGVldHMuanNcIjtcblxuY29uc3QgT1JERVJTX1RBQiA9IFwiT3JkZXJzXCI7XG5jb25zdCBIRUFERVJTID0gW1xuICBcIkRhdGVcIixcIkN1c3RvbWVyIE5hbWVcIixcIlBob25lXCIsXCJQcm9kdWN0XCIsXCJRdWFudGl0eVwiLFwiVW5pdCBQcmljZVwiLFwiVG90YWxcIixcIk9yZGVyICNcIixcIlByb2R1Y3QgSW5jcmVtZW50XCJcbl07XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIChyZXF1ZXN0KSA9PiB7XG4gIGNvbnNvbGUubG9nKFwic3VibWl0LW9yZGVyIGZ1bmN0aW9uIGludm9rZWRcIik7XG4gIGNvbnNvbGUubG9nKFwiUmVxdWVzdCBtZXRob2Q6XCIsIHJlcXVlc3QubWV0aG9kKTtcbiAgbGV0IGJvZHkgPSB7fTtcbiAgdHJ5IHtcbiAgICBpZiAocmVxdWVzdC5tZXRob2QgIT09IFwiUE9TVFwiKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIk1ldGhvZCBub3QgYWxsb3dlZFwiKTtcbiAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoXCJNZXRob2QgTm90IEFsbG93ZWRcIiwgeyBzdGF0dXM6IDQwNSB9KTtcbiAgICB9XG4gICAgYm9keSA9IGF3YWl0IHJlcXVlc3QuanNvbigpO1xuICAgIGNvbnN0IG5hbWUgPSBTdHJpbmcoYm9keS5uYW1lIHx8IFwiXCIpLnRyaW0oKTtcbiAgICBjb25zdCBwaG9uZSA9IFN0cmluZyhib2R5LnBob25lIHx8IFwiXCIpLnRyaW0oKTtcbiAgICBjb25zdCBwcm9kdWN0ID0gU3RyaW5nKGJvZHkucHJvZHVjdCB8fCBcIlwiKS50cmltKCk7XG4gICAgY29uc3QgcXR5ID0gTnVtYmVyKGJvZHkucXR5KTtcblxuICAgIGNvbnNvbGUubG9nKFwiUGFyc2VkIGJvZHk6XCIsIHsgbmFtZSwgcGhvbmUsIHByb2R1Y3QsIHF0eSB9KTtcblxuICAgIGlmICghbmFtZSkge1xuICAgICAgY29uc29sZS5sb2coXCJWYWxpZGF0aW9uIGZhaWxlZDogTmFtZSBpcyByZXF1aXJlZFwiKTtcbiAgICAgIHJldHVybiBqc29uUmVzcG9uc2UoeyBvazogZmFsc2UsIGVycm9yOiBcIk5hbWUgaXMgcmVxdWlyZWRcIiB9LCA0MDApO1xuICAgIH1cbiAgICBpZiAoIXBob25lKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlZhbGlkYXRpb24gZmFpbGVkOiBQaG9uZSBpcyByZXF1aXJlZFwiKTtcbiAgICAgIHJldHVybiBqc29uUmVzcG9uc2UoeyBvazogZmFsc2UsIGVycm9yOiBcIlBob25lIGlzIHJlcXVpcmVkXCIgfSwgNDAwKTtcbiAgICB9XG4gICAgaWYgKCFwcm9kdWN0KSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlZhbGlkYXRpb24gZmFpbGVkOiBQcm9kdWN0IGlzIHJlcXVpcmVkXCIpO1xuICAgICAgcmV0dXJuIGpzb25SZXNwb25zZSh7IG9rOiBmYWxzZSwgZXJyb3I6IFwiUHJvZHVjdCBpcyByZXF1aXJlZFwiIH0sIDQwMCk7XG4gICAgfVxuICAgIGlmICghKHF0eSA+PSAxKSkge1xuICAgICAgY29uc29sZS5sb2coXCJWYWxpZGF0aW9uIGZhaWxlZDogUXVhbnRpdHkgbXVzdCBiZSBcdTIyNjUgMVwiKTtcbiAgICAgIHJldHVybiBqc29uUmVzcG9uc2UoeyBvazogZmFsc2UsIGVycm9yOiBcIlF1YW50aXR5IG11c3QgYmUgXHUyMjY1IDFcIiB9LCA0MDApO1xuICAgIH1cblxuICAgIGNvbnN0IGF1dGggPSBnZXRBdXRoKCk7XG4gICAgY29uc3Qgc2hlZXRzID0gZ2V0U2hlZXRzQ2xpZW50KGF1dGgpO1xuICAgIGNvbnN0IHNwcmVhZHNoZWV0SWQgPSBwcm9jZXNzLmVudi5TSEVFVF9JRDtcblxuICAgIGNvbnN0IG5vd0lTTyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICBjb25zdCB1bml0ID0gdW5pdFByaWNlKCk7XG4gICAgY29uc3QgdG90YWwgPSB1bml0ICogcXR5O1xuXG4gICAgY29uc29sZS5sb2coXCJBcHBlbmRpbmcgb3JkZXIgcm93OlwiLCB7IG5vd0lTTywgbmFtZSwgcGhvbmUsIHByb2R1Y3QsIHF0eSwgdW5pdCwgdG90YWwgfSk7XG5cbiAgICAvLyAxKSBFbnN1cmUgT3JkZXJzIHRhYiBleGlzdHMgd2l0aCBoZWFkZXJzXG4gICAgYXdhaXQgZW5zdXJlT3JkZXJzVGFiKHNoZWV0cywgc3ByZWFkc2hlZXRJZCk7XG5cbiAgICAvLyAyKSBDb21wdXRlIG5leHQgT3JkZXIgIyAobWF4IGluIE9yZGVycyFIOkgpIFx1MjAxNCBzaW1wbGUgJiBzYWZlIGZvciBzbWFsbC9tZWQgc2NhbGVcbiAgICBjb25zdCBuZXh0T3JkZXIgPSBhd2FpdCBuZXh0T3JkZXJOdW1iZXIoc2hlZXRzLCBzcHJlYWRzaGVldElkKTtcbiAgICBjb25zb2xlLmxvZyhcIk5leHQgb3JkZXIgbnVtYmVyOlwiLCBuZXh0T3JkZXIpO1xuXG4gICAgLy8gMykgQ29tcHV0ZSBwcm9kdWN0IGluY3JlbWVudCA9IENPVU5USUYoT3JkZXJzIUQ6RCwgcHJvZHVjdCkgKyAxXG4gICAgY29uc3QgcHJvZHVjdEluYyA9IGF3YWl0IG5leHRQcm9kdWN0SW5jcmVtZW50KHNoZWV0cywgc3ByZWFkc2hlZXRJZCwgcHJvZHVjdCk7XG4gICAgY29uc29sZS5sb2coXCJQcm9kdWN0IGluY3JlbWVudDpcIiwgcHJvZHVjdEluYyk7XG5cbiAgICAvLyA0KSBBcHBlbmQgdG8gT3JkZXJzXG4gICAgY29uc3Qgcm93ID0gW1xuICAgICAgbm93SVNPLCBuYW1lLCBwaG9uZSwgcHJvZHVjdCwgcXR5LCB1bml0LCB0b3RhbCwgbmV4dE9yZGVyLCBwcm9kdWN0SW5jXG4gICAgXTtcbiAgICBhd2FpdCBzaGVldHMuc3ByZWFkc2hlZXRzLnZhbHVlcy5hcHBlbmQoe1xuICAgICAgc3ByZWFkc2hlZXRJZCxcbiAgICAgIHJhbmdlOiBgJHtPUkRFUlNfVEFCfSFBOklgLFxuICAgICAgdmFsdWVJbnB1dE9wdGlvbjogXCJSQVdcIixcbiAgICAgIHJlcXVlc3RCb2R5OiB7IHZhbHVlczogW3Jvd10gfSxcbiAgICB9KTtcblxuICAgIC8vIDUpIEVuc3VyZSBtb250aCB0YWIgZXhpc3RzLCBhcHBlbmQgdGhlcmUgdG9vXG4gICAgY29uc3QgbU5hbWUgPSBtb250aFNoZWV0TmFtZShuZXcgRGF0ZSgpKTtcbiAgICBhd2FpdCBlbnN1cmVNb250aFRhYihzaGVldHMsIHNwcmVhZHNoZWV0SWQsIG1OYW1lKTtcbiAgICBhd2FpdCBzaGVldHMuc3ByZWFkc2hlZXRzLnZhbHVlcy5hcHBlbmQoe1xuICAgICAgc3ByZWFkc2hlZXRJZCxcbiAgICAgIHJhbmdlOiBgJHttTmFtZX0hQTpJYCxcbiAgICAgIHZhbHVlSW5wdXRPcHRpb246IFwiUkFXXCIsXG4gICAgICByZXF1ZXN0Qm9keTogeyB2YWx1ZXM6IFtyb3ddIH0sXG4gICAgfSk7XG5cbiAgICAvLyA2KSBSZXNwb25kIHdpdGggcmVjYXAgSlNPTlxuICAgIGNvbnNvbGUubG9nKFwiT3JkZXIgc3VjY2Vzc2Z1bGx5IGFwcGVuZGVkXCIpO1xuICAgIHJldHVybiBqc29uUmVzcG9uc2Uoe1xuICAgICAgb2s6IHRydWUsXG4gICAgICBvcmRlck5vOiBuZXh0T3JkZXIsXG4gICAgICBpdGVtOiB7IHByb2R1Y3QsIHF0eSwgdW5pdCwgdG90YWwgfSxcbiAgICAgIGN1c3RvbWVyOiB7IG5hbWUsIHBob25lIH0sXG4gICAgICB0aW1lc3RhbXA6IG5vd0lTT1xuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGluIHN1Ym1pdC1vcmRlciBmdW5jdGlvbjpcIiwgZSk7XG4gICAgcmV0dXJuIGpzb25SZXNwb25zZSh7IG9rOiBmYWxzZSwgZXJyb3I6IFN0cmluZyhlICYmIGUubWVzc2FnZSA/IGUubWVzc2FnZSA6IGUpIH0sIDUwMCk7XG4gIH1cblxuZnVuY3Rpb24ganNvblJlc3BvbnNlKGRhdGEsIHN0YXR1cyA9IDIwMCkge1xuICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoZGF0YSk7XG4gIGNvbnNvbGUubG9nKFwiUmV0dXJuaW5nIHJlc3BvbnNlOlwiLCBib2R5KTtcbiAgcmV0dXJuIG5ldyBSZXNwb25zZShib2R5LCB7XG4gICAgc3RhdHVzLFxuICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfVxuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlT3JkZXJzVGFiKHNoZWV0cywgc3ByZWFkc2hlZXRJZCkge1xuICBjb25zdCBtZXRhID0gYXdhaXQgc2hlZXRzLnNwcmVhZHNoZWV0cy5nZXQoeyBzcHJlYWRzaGVldElkIH0pO1xuICBjb25zdCBleGlzdHMgPSBtZXRhLmRhdGEuc2hlZXRzPy5zb21lKHMgPT4gcy5wcm9wZXJ0aWVzPy50aXRsZSA9PT0gT1JERVJTX1RBQik7XG4gIGlmIChleGlzdHMpIHJldHVybjtcblxuICBhd2FpdCBzaGVldHMuc3ByZWFkc2hlZXRzLmJhdGNoVXBkYXRlKHtcbiAgICBzcHJlYWRzaGVldElkLFxuICAgIHJlcXVlc3RCb2R5OiB7XG4gICAgICByZXF1ZXN0czogW3tcbiAgICAgICAgYWRkU2hlZXQ6IHsgcHJvcGVydGllczogeyB0aXRsZTogT1JERVJTX1RBQiwgZ3JpZFByb3BlcnRpZXM6IHsgZnJvemVuUm93Q291bnQ6IDEgfSB9IH1cbiAgICAgIH1dXG4gICAgfVxuICB9KTtcbiAgYXdhaXQgc2hlZXRzLnNwcmVhZHNoZWV0cy52YWx1ZXMudXBkYXRlKHtcbiAgICBzcHJlYWRzaGVldElkLFxuICAgIHJhbmdlOiBgJHtPUkRFUlNfVEFCfSFBMTpJMWAsXG4gICAgdmFsdWVJbnB1dE9wdGlvbjogXCJSQVdcIixcbiAgICByZXF1ZXN0Qm9keTogeyB2YWx1ZXM6IFtIRUFERVJTXSB9XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBlbnN1cmVNb250aFRhYihzaGVldHMsIHNwcmVhZHNoZWV0SWQsIHRpdGxlKSB7XG4gIGNvbnN0IG1ldGEgPSBhd2FpdCBzaGVldHMuc3ByZWFkc2hlZXRzLmdldCh7IHNwcmVhZHNoZWV0SWQgfSk7XG4gIGNvbnN0IGV4aXN0cyA9IG1ldGEuZGF0YS5zaGVldHM/LnNvbWUocyA9PiBzLnByb3BlcnRpZXM/LnRpdGxlID09PSB0aXRsZSk7XG4gIGlmIChleGlzdHMpIHJldHVybjtcblxuICBhd2FpdCBzaGVldHMuc3ByZWFkc2hlZXRzLmJhdGNoVXBkYXRlKHtcbiAgICBzcHJlYWRzaGVldElkLFxuICAgIHJlcXVlc3RCb2R5OiB7XG4gICAgICByZXF1ZXN0czogW3tcbiAgICAgICAgYWRkU2hlZXQ6IHsgcHJvcGVydGllczogeyB0aXRsZSwgZ3JpZFByb3BlcnRpZXM6IHsgZnJvemVuUm93Q291bnQ6IDEgfSB9IH1cbiAgICAgIH1dXG4gICAgfVxuICB9KTtcbiAgYXdhaXQgc2hlZXRzLnNwcmVhZHNoZWV0cy52YWx1ZXMudXBkYXRlKHtcbiAgICBzcHJlYWRzaGVldElkLFxuICAgIHJhbmdlOiBgJHt0aXRsZX0hQTE6STFgLFxuICAgIHZhbHVlSW5wdXRPcHRpb246IFwiUkFXXCIsXG4gICAgcmVxdWVzdEJvZHk6IHsgdmFsdWVzOiBbSEVBREVSU10gfVxuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbmV4dE9yZGVyTnVtYmVyKHNoZWV0cywgc3ByZWFkc2hlZXRJZCkge1xuICAvLyBSZWFkIE9yZGVyICMgY29sdW1uIEggKDgpIGFuZCBjb21wdXRlIG1heCArIDFcbiAgY29uc3QgcmVzID0gYXdhaXQgc2hlZXRzLnNwcmVhZHNoZWV0cy52YWx1ZXMuZ2V0KHtcbiAgICBzcHJlYWRzaGVldElkLFxuICAgIHJhbmdlOiBgJHtPUkRFUlNfVEFCfSFIMjpIYFxuICB9KTtcbiAgY29uc3Qgcm93cyA9IHJlcy5kYXRhLnZhbHVlcyB8fCBbXTtcbiAgbGV0IG1heCA9IDA7XG4gIGZvciAoY29uc3QgW3ZdIG9mIHJvd3MpIHtcbiAgICBjb25zdCBuID0gTnVtYmVyKHYpO1xuICAgIGlmIChOdW1iZXIuaXNGaW5pdGUobikgJiYgbiA+IG1heCkgbWF4ID0gbjtcbiAgfVxuICByZXR1cm4gbWF4ICsgMTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbmV4dFByb2R1Y3RJbmNyZW1lbnQoc2hlZXRzLCBzcHJlYWRzaGVldElkLCBwcm9kdWN0KSB7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IHNoZWV0cy5zcHJlYWRzaGVldHMudmFsdWVzLmdldCh7XG4gICAgc3ByZWFkc2hlZXRJZCxcbiAgICByYW5nZTogYCR7T1JERVJTX1RBQn0hRDI6RGBcbiAgfSk7XG4gIGNvbnN0IHJvd3MgPSByZXMuZGF0YS52YWx1ZXMgfHwgW107XG4gIGxldCBjb3VudCA9IDA7XG4gIGZvciAoY29uc3QgW3BdIG9mIHJvd3MpIGlmIChTdHJpbmcocCkudHJpbSgpID09PSBwcm9kdWN0KSBjb3VudCsrO1xuICByZXR1cm4gY291bnQgKyAxO1xufVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7OztBQUFBLFNBQVMsY0FBYztBQUVoQixTQUFTLFVBQVU7QUFDeEIsUUFBTSxRQUFRLEtBQUssTUFBTSxRQUFRLElBQUksMkJBQTJCO0FBQ2hFLFNBQU8sSUFBSSxPQUFPLEtBQUs7QUFBQSxJQUNyQixNQUFNO0FBQUEsSUFDTjtBQUFBLElBQ0EsTUFBTTtBQUFBLElBQ04sQ0FBQyw4Q0FBOEM7QUFBQSxFQUNqRDtBQUNGO0FBRU8sU0FBUyxnQkFBZ0IsTUFBTTtBQUNwQyxTQUFPLE9BQU8sT0FBTyxFQUFFLFNBQVMsTUFBTSxLQUFLLENBQUM7QUFDOUM7QUFFTyxTQUFTLFlBQVk7QUFDMUIsUUFBTSxNQUFNLE9BQU8sUUFBUSxJQUFJLFVBQVU7QUFDekMsU0FBTyxPQUFPLFNBQVMsR0FBRyxLQUFLLE1BQU0sSUFBSSxNQUFNO0FBQ2pEO0FBR08sU0FBUyxlQUFlLE9BQU8sb0JBQUksS0FBSyxHQUFHO0FBQ2hELFFBQU0sSUFBSSxLQUFLLGVBQWUsU0FBUyxFQUFFLE9BQU8sUUFBUSxDQUFDO0FBQ3pELFFBQU0sSUFBSSxLQUFLLFlBQVk7QUFD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
