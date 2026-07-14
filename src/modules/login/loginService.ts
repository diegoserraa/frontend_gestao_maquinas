import type {
  LoginPayload,
  LoginResponse,
} from "./loginType";


const API_URL = import.meta.env.VITE_API_URL;


export async function login(
  payload: LoginPayload
): Promise<LoginResponse> {


  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    }
  );


  if (!response.ok) {
    throw new Error(
      "Usuário ou senha inválidos"
    );
  }


  return response.json();

}