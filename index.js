const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configuración del service account desde variables de entorno
const serviceAccount = {
  type: getEnvVar('type'),
  project_id: getEnvVar('project_id'),
  private_key_id: getEnvVar('private_key_id'),
  private_key: getEnvVar('private_key').replace(/\\n/g, '\n'),
  client_email: getEnvVar('client_email'),
  client_id: getEnvVar('client_id'),
  auth_uri: getEnvVar('auth_uri'),
  token_uri: getEnvVar('token_uri'),
  auth_provider_x509_cert_url: getEnvVar('auth_provider_x509_cert_url'),
  client_x509_cert_url: getEnvVar('client_x509_cert_url'),
  universe_domain: getEnvVar('universe_domain'),
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
