const API_URL = "http://localhost:3000/api";
const SESSION_KEY = "nexora.session";

function obtenerToken() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null")?.token || null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function procesarNoAutorizado(response) {
  if (response.status === 401) {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event("nexora:unauthorized"));
  }
}


async function request(endpoint, options = {}) {
  const token = obtenerToken();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  procesarNoAutorizado(response);

  if (!response.ok) {
    throw new Error(
      data?.mensaje || "Ocurrió un error en la solicitud"
    );
  }

  return data;
}

async function download(endpoint, filename) {
  const token = obtenerToken();
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  procesarNoAutorizado(response);

  if (!response.ok) {
    let mensaje = "No se pudo descargar el archivo.";

    try {
      const data = await response.json();
      mensaje = data?.mensaje || mensaje;
    } catch {
      // La respuesta puede ser un archivo y no JSON
    }

    throw new Error(mensaje);
  }

  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);

  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = filename;

  document.body.appendChild(enlace);
  enlace.click();

  enlace.remove();

  window.URL.revokeObjectURL(url);
}

async function upload(endpoint, formData) {
  const token = obtenerToken();
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  procesarNoAutorizado(response);
  if (!response.ok) throw new Error(data?.mensaje || "No se pudo subir el archivo.");
  return data;
}

export const api = {

  get: (endpoint) =>
    request(endpoint),

  post: (endpoint, body) =>
    request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (endpoint, body) =>
    request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: (endpoint, body) =>
    request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: (endpoint) =>
    request(endpoint, {
      method: "DELETE",
    }),

  download,
  upload,
};
