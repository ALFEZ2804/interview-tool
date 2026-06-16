import crypto from "node:crypto";

// Cifrado simétrico de los refresh tokens de Google en reposo. La clave (32
// bytes en hex = 64 caracteres) vive en TOKEN_ENC_KEY (env), nunca en la BD.
// Así, aunque alguien lea la tabla GoogleAccount, los tokens son inservibles
// sin la clave.
const ALGO = "aes-256-gcm";

function key(): Buffer {
  const hex = process.env.TOKEN_ENC_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("TOKEN_ENC_KEY debe ser 32 bytes en hex (64 caracteres).");
  }
  return Buffer.from(hex, "hex");
}

// Formato almacenado: iv:authTag:ciphertext (todo en hex).
export function encryptToken(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), enc.toString("hex")].join(":");
}

export function decryptToken(stored: string): string {
  const [ivHex, tagHex, dataHex] = stored.split(":");
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Token cifrado con formato inválido.");
  }
  const decipher = crypto.createDecipheriv(
    ALGO,
    key(),
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}
