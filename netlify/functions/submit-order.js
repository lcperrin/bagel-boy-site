
import { getAuth, getSheetsClient, unitPrice, monthSheetName } from "./utils/sheets.js";

const ORDERS_TAB = "Orders";
const HEADERS = [
  "Date","Customer Name","Phone","Product","Quantity","Unit Price","Total","Order #","Product Increment"
];

export default async (request) => {
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
      console.log("Validation failed: Quantity must be ≥ 1");
      return jsonResponse({ ok: false, error: "Quantity must be ≥ 1" }, 400);
    }

    const auth = getAuth();
    const sheets = getSheetsClient(auth);
    const spreadsheetId = process.env.SHEET_ID;

    const nowISO = new Date().toISOString();
    const unit = unitPrice();
    const total = unit * qty;

    console.log("Appending order row:", { nowISO, name, phone, product, qty, unit, total });

    // 1) Ensure Orders tab exists with headers
    await ensureOrdersTab(sheets, spreadsheetId);

    // 2) Compute next Order # (max in Orders!H:H) — simple & safe for small/med scale
    const nextOrder = await nextOrderNumber(sheets, spreadsheetId);
    console.log("Next order number:", nextOrder);

    // 3) Compute product increment = COUNTIF(Orders!D:D, product) + 1
    const productInc = await nextProductIncrement(sheets, spreadsheetId, product);
    console.log("Product increment:", productInc);

    // 4) Append to Orders
    const row = [
      nowISO, name, phone, product, qty, unit, total, nextOrder, productInc
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${ORDERS_TAB}!A:I`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });

    // 5) Ensure month tab exists, append there too
    const mName = monthSheetName(new Date());
    await ensureMonthTab(sheets, spreadsheetId, mName);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${mName}!A:I`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });

    // 6) Respond with recap JSON
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
}

function jsonResponse(data, status = 200) {
  const body = JSON.stringify(data);
  console.log("Returning response:", body);
  return new Response(body, {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function ensureOrdersTab(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets?.some(s => s.properties?.title === ORDERS_TAB);
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
  const exists = meta.data.sheets?.some(s => s.properties?.title === title);
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
  // Read Order # column H (8) and compute max + 1
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
}
