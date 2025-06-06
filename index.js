const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configuración del service account desde variables de entorno
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

// Inicializa Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function backupFirestore() {
  const collections = await db.listCollections();
  const backup = {};

  for (const col of collections) {
    const snapshot = await col.get();
    backup[col.id] = [];

    snapshot.forEach(doc => {
      backup[col.id].push({ id: doc.id, ...doc.data() });
    });
  }

  // Fecha actual
  const now = new Date();
  const dateString = now.toISOString().slice(0, 10); // YYYY-MM-DD

  // Carpeta destino: ./backups/YYYY-MM-DD/
  const folderPath = path.join(__dirname, 'backups', dateString);
  fs.mkdirSync(folderPath, { recursive: true });

  // Guardar archivo
  const filePath = path.join(folderPath, `backup-${dateString}.json`);
  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));
  console.log(`✅ Backup generado: ${filePath}`);
}

// Ejecutar la función
backupFirestore().catch(err => {
  console.error("❌ Error al hacer el backup:", err);
});
