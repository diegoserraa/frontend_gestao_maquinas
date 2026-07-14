const API_URL = import.meta.env.VITE_API_URL;

export async function getPartners() {
  const res = await fetch(
    `${API_URL}/parceiros`
  );

  return res.json();
}

export async function createPartner(
  payload: unknown
) {
  return fetch(
    `${API_URL}/parceiros`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        payload
      ),
    }
  );
}

export async function updatePartner(
  id: number,
  payload: unknown
) {
  return fetch(
    `${API_URL}/parceiros/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        payload
      ),
    }
  );
}

export async function deletePartner(
  id: number
) {
  return fetch(
    `${API_URL}/parceiros/${id}`,
    {
      method: "DELETE",
    }
  );
}