// ─── IPFS Upload via Pinata ─────────────────────────────────────────────────
// Sign up at https://www.pinata.cloud/ and grab your JWT token.
// Put it in frontend/.env  →  VITE_PINATA_JWT=your_jwt_here

const PINATA_API = "https://api.pinata.cloud";
const JWT = () => import.meta.env.VITE_PINATA_JWT || "";

/**
 * Upload a File (image) to Pinata/IPFS.
 * Returns the IPFS URI  →  ipfs://<CID>
 */
export async function uploadFileToIPFS(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, {
    method: "POST",
    headers: { Authorization: `Bearer ${JWT()}` },
    body: formData,
  });

  if (!res.ok) throw new Error("Image upload to IPFS failed");
  const data = await res.json();
  return `ipfs://${data.IpfsHash}`;
}

/**
 * Upload JSON metadata to Pinata/IPFS.
 * Returns the IPFS URI  →  ipfs://<CID>
 */
export async function uploadJSONToIPFS(jsonObject) {
  const res = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT()}`,
    },
    body: JSON.stringify({ pinataContent: jsonObject }),
  });

  if (!res.ok) throw new Error("Metadata upload to IPFS failed");
  const data = await res.json();
  return `ipfs://${data.IpfsHash}`;
}

/**
 * Convert an ipfs:// URI to an HTTP gateway URL for display.
 */
export function ipfsToHTTP(uri) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  }
  return uri; // already http
}
