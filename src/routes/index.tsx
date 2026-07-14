import { createBrowserRouter } from "react-router-dom";


import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/routes/protectRoutes";


import Dashboard from "@/pages/Dashboard";
import Machines from "@/pages/Machines";
import Sector from "@/pages/Sector";
import User from "@/pages/User";
import Partner from "@/pages/Partner";

import MachineDetails from "@/pages/Mantenance";
import Login from "@/pages/Login";



export const router = createBrowserRouter([



  // 🔐 ROTA PÚBLICA
  {
    path: "/login",
    element: <Login />,
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
        element: <Machines />,
      },


      {
        path: "machines/:id",
        element: <MachineDetails />,
      },


      {
        path: "sector",
        element: <Sector />,
      },


      {
        path: "partner",
        element: <Partner />,
      },


      {
        path: "user",
        element: <User />,
      },


    ],

  },


]);