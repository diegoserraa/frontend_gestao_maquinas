import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [scannerAberto, setScannerAberto] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();

  const iniciarScanner = async () => {
    try {
      setScannerAberto(true);

      setTimeout(async () => {
        if (scannerRef.current) return;

        scannerRef.current = new Html5Qrcode("reader");

        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: 250,
          },
          async (decodedText) => {
            try {
              await scannerRef.current?.stop();
              await scannerRef.current?.clear();

              scannerRef.current = null;
              setScannerAberto(false);

              navigate(`/maquinas/${decodedText}`);
            } catch (error) {
              console.error(error);
            }
          },
          () => {}
        );
      }, 100);
    } catch (error) {
      console.error(error);
      alert("Erro ao abrir câmera.");
    }
  };

  const pararScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();

        scannerRef.current = null;
      }

      setScannerAberto(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Dashboard
        </h1>

        <p className="text-sm text-slate-500">
          Visão geral do seu sistema
        </p>
      </div>

      {/* BOTÃO TESTE QR */}
      <div className="flex gap-2">
        <Button onClick={iniciarScanner}>
          Escanear QR
        </Button>

        {scannerAberto && (
          <Button
            variant="destructive"
            onClick={pararScanner}
          >
            Fechar Scanner
          </Button>
        )}
      </div>

      {/* SCANNER */}
      {scannerAberto && (
        <Card>
          <CardContent className="p-4">
            <div id="reader" />
          </CardContent>
        </Card>
      )}

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">
              Máquinas ativas
            </p>

            <h2 className="text-2xl font-bold text-slate-800">
              12
            </h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">
              Clientes
            </p>

            <h2 className="text-2xl font-bold text-slate-800">
              48
            </h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">
              Chamados abertos
            </p>

            <h2 className="text-2xl font-bold text-slate-800">
              3
            </h2>
          </CardContent>
        </Card>
      </div>

      {/* AREA PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold mb-4">
            Últimas máquinas
          </h3>

          <div className="space-y-3">
            {[
              "Máquina 01",
              "Máquina 02",
              "Máquina 03",
            ].map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50"
              >
                <span>{item}</span>

                <span className="text-xs text-green-600">
                  Online
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold mb-4">
            Atividades recentes
          </h3>

          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              ✔ Máquina 01 conectada
            </p>

            <p className="text-sm text-slate-600">
              ✔ Cliente novo cadastrado
            </p>

            <p className="text-sm text-slate-600">
              ✔ Manutenção concluída
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}