const { put, list } = require("@vercel/blob");
const F = "loyal-taxi-data.json";
async function read() {
  const { blobs } = await list({ prefix: F });
  if (!blobs.length) return { orders: [], drivers: [] };
  const r = await fetch(blobs[0].url + "?t=" + Date.now());
  return await r.json();
}
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (process.env.APP_KEY && req.headers["x-key"] !== process.env.APP_KEY)
    return res.status(401).json({ error: "key" });
  const s = await read();
  if (req.method === "POST") {
    const { op, col, id, data } = req.body || {};
    if (!["orders", "drivers"].includes(col) || !id) return res.status(400).json({ error: "bad" });
    s[col] = (s[col] || []).filter((x) => x.id !== id);
    if (op === "set") s[col].push({ ...data, id });
    await put(F, JSON.stringify(s), { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
  }
  res.status(200).json(s);
};
