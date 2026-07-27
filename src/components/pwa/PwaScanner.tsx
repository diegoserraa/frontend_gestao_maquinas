import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface PwaScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export default function PwaScanner({
  onScan,
  onClose,
}: PwaScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const iniciar = async () => {
      try {
        scannerRef.current = new Html5Qrcode("qr-reader");

        await scannerRef.current.start(
          {
            facingMode: "environment",
          },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
          },
          async (decodedText) => {
            await finalizar();

            onScan(decodedText);
          },
          () => {}
        );
      } catch (error) {
        console.error("Erro scanner:", error);
      }
    };

    iniciar();

    return () => {
      finalizar();
    };
  }, []);

  const finalizar = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();

        scannerRef.current = null;
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fechar = async () => {
    await finalizar();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl">
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Escanear máquina
            </h2>

            <p className="text-sm text-slate-500">
              Aponte a câmera para o QR Code
            </p>
          </div>

          <button
            onClick={fechar}
            className="text-slate-500 hover:text-slate-800"
          >
            ✕
          </button>
        </div>


        <div
          id="qr-reader"
          className="overflow-hidden rounded-xl"
        />


        <button
          onClick={fechar}
          className="
            mt-5
            w-full
            rounded-xl
            bg-slate-100
            py-3
            text-sm
            font-medium
            text-slate-700
            hover:bg-slate-200
          "
        >
          Cancelar
        </button>

      </div>
    </div>
  );
}