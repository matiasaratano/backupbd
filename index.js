const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin lo antes posible para asegurar que Firestore esté listo
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin inicializado correctamente');
}

// Obtener referencia a Firestore después de la inicialización
const db = admin.firestore();

// Función para obtener variable de entorno y validar que exista
function getEnvVar(name) {
  const val = process.env[name];
  if (!val) {
    throw new Error(`La variable de entorno ${name} no está definida`);
  }
  return val;
}

// Cargar y mostrar variables de entorno para depuración
console.log('Variables de entorno cargadas:');
console.log({
  type: process.env.type,
  project_id: process.env.project_id,
  private_key_id: process.env.private_key_id,
  private_key: process.env.private_key ? '[OK]' : '[NO]',
  client_email: process.env.client_email,
  client_id: process.env.client_id,
  auth_uri: process.env.auth_uri,
  token_uri: process.env.token_uri,
  auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
  client_x509_cert_url: process.env.client_x509_cert_url,
  universe_domain: process.env.universe_domain,
});

// Configurar credenciales de Firebase
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

// Inicializar Firebase Admin lo antes posible para asegurar que Firestore esté listo
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin inicializado correctamente');
}

// Obtener referencia a Firestore después de la inicialización
const db = admin.firestore();

async function backupFirestore() {
  try {
    // Obtener todas las colecciones
    const collections = await db.listCollections();
    const backup = {};

    // Iterar sobre las colecciones y guardar los documentos
    for (const col of collections) {
      const snapshot = await col.get();
      backup[col.id] = [];

      snapshot.forEach(doc => {
        backup[col.id].push({ id: doc.id, ...doc.data() });
      });
    }

    // Generar nombre de archivo con fecha actual (YYYY-MM-DD)
    const now = new Date();
    const dateString = now.toISOString().slice(0, 10);

    // Crear carpeta de backups
    const folderPath = path.join(__dirname, 'backups', dateString);
    fs.mkdirSync(folderPath, { recursive: true });

    // Guardar el backup en un archivo JSON
    const filePath = path.join(folderPath, `backup-${dateString}.json`);
    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup generado: ${filePath}`);
  } catch (err) {
    console.error('❌ Error al hacer el backup:', err);
    throw err; // Re-lanzar el error para que Railway lo detecte
  }
}

// Ejecutar la función de backup
backupFirestore().catch(err => {
  console.error('❌ Error en la ejecución del backup:', err);
  process.exit(1); // Salir con error para que Railway marque el despliegue como fallido
});