import { createBrowserRouter } from "react-router-dom";


import MainLayout from "@/components/layout/MainLayout";
import { RotaComPermissao, RotaSoAdmin } from "@/modules/permissoes/Pode";
import ProtectedRoute from "@/routes/protectRoutes";


import Dashboard from "@/pages/Dashboard";
import Machines from "@/pages/Machines";
import Sector from "@/pages/Sector";
import User from "@/pages/User";
import Partner from "@/pages/Partner";

import MachineDetails from "@/pages/Mantenance";
import Login from "@/pages/Login";

import OrdemServicoDetails from "@/pages/OrdemServico";
import Reports from "@/pages/Relatorio";
import Monitoring from "@/pages/Monitoring";
import Empresas from "@/pages/Empresas";
import TrocarSenha from "@/pages/TrocarSenha";



export const router = createBrowserRouter([


  // 🔐 ROTA PÚBLICA
  {
    path: "/login",
    element: <Login />,
  },


  // primeiro acesso (senha temporária): fora do layout, o sistema só libera depois de trocar
  {
    path: "/trocar-senha",
    element: <TrocarSenha />,
  },


  // 🔒 ROTAS PROTEGIDAS
  {
    path: "/",

    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),


    children: [

      {
        index: true,
        element: <Dashboard />,
      },


      {
        path: "machines",
        element: (
          <RotaComPermissao permissao="maquinas.ver">
            <Machines />
          </RotaComPermissao>
        ),
      },


      {
        path: "monitoring",
        element: (
          <RotaComPermissao permissao="monitoramento.ver">
            <Monitoring />
          </RotaComPermissao>
        ),
      },


      {
        path: "machines/:id",
        element: (
          <RotaComPermissao permissao="maquinas.ver">
            <MachineDetails />
          </RotaComPermissao>
        ),
      },


      {
        path: "ordens-servico/:id",
        element: (
          <RotaComPermissao qualquer={["os.ver", "os.ver_proprias"]}>
            <OrdemServicoDetails />
          </RotaComPermissao>
        ),
      },


      {
        path: "sector",
        element: (
          <RotaComPermissao permissao="setores.ver">
            <Sector />
          </RotaComPermissao>
        ),
      },


      {
        path: "partner",
        element: (
          <RotaComPermissao permissao="parceiros.ver">
            <Partner />
          </RotaComPermissao>
        ),
      },


      {
        path: "user",
        element: (
          <RotaComPermissao permissao="usuarios.ver">
            <User />
          </RotaComPermissao>
        ),
      },
      {
        path: "admin/empresas",
        element: (
          <RotaSoAdmin>
            <Empresas />
          </RotaSoAdmin>
        ),
      },

       {
        path: "reports",
        element: (
          <RotaComPermissao permissao="relatorios.ver">
            <Reports />
          </RotaComPermissao>
        ),
      },


    ],

  },


]);