const API_URL = import.meta.env.VITE_API_URL;

export async function getUsers() {
  const res = await fetch(`${API_URL}/usuarios`);
  return res.json();
}

export async function createUser(payload: unknown) {
  return fetch(`${API_URL}/usuarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function updateUser(
  id: number,
  payload: unknown
) {
  return fetch(`${API_URL}/usuarios/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function toggleUserStatus(
  id: number
) {
  return fetch(
    `${API_URL}/usuarios/${id}/toggle-status`,
    {
      method: "PATCH",
    }
  );
}

export async function deleteUser(id: number) {
  return fetch(`${API_URL}/usuarios/${id}`, {
    method: "DELETE",
  });
}