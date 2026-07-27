import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

import { Button } from "@/components/ui/button";

interface PwaScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export default function PwaScanner({
  onScan,
  onClose,
}: PwaScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
    };
  }, []);


  const startScanner = async () => {
    try {
      setLoading(true);
      setError("");

      const scanner = new Html5Qrcode("qr-reader");

      scannerRef.current = scanner;


      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,
          qrbox: 250,
        },
        async (decodedText) => {
          await stopScanner();

          onScan(decodedText);
        },
        () => {}
      );


      setLoading(false);

    } catch (err) {
      console.error(err);

      setError(
        "Não foi possível abrir a câmera."
      );

      setLoading(false);
    }
  };


  const stopScanner = async () => {
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


  const handleClose = async () => {
    await stopScanner();

    onClose();
  };


  return (
    <div
      className="
        fixed
        inset-0
        z-[999]
        flex
        h-screen
        w-screen
        flex-col
        overflow-hidden
        bg-black
      "
    >

      {/* HEADER */}
      <div
        className="
          flex
          items-center
          justify-between
          px-5
          py-4
          text-white
        "
      >
        <div>
          <h2 className="text-lg font-semibold">
            Escanear QR Code
          </h2>

          <p className="text-sm text-white/60">
            Aponte para a etiqueta da máquina
          </p>
        </div>


        <Button
          variant="secondary"
          size="icon"
          onClick={handleClose}
          className="
            rounded-full
          "
        >
          ✕
        </Button>

      </div>


      {/* CAMERA */}
      <div
        className="
          relative
          flex-1
          overflow-hidden
        "
      >

        {loading && (
          <div
            className="
              absolute
              inset-0
              z-10
              flex
              items-center
              justify-center
              text-sm
              text-white
            "
          >
            Abrindo câmera...
          </div>
        )}


        <div
          id="qr-reader"
          className="
            h-full
            w-full
          "
        />


        {/* MARCAÇÃO DO QR */}
        {!loading && (
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              flex
              items-center
              justify-center
            "
          >
            <div
              className="
                h-64
                w-64
                rounded-2xl
                border-4
                border-white
                shadow-2xl
              "
            />
          </div>
        )}

      </div>


      {/* FOOTER */}
      <div
        className="
          px-5
          py-5
          text-center
          text-sm
          text-white/70
        "
      >
        Centralize o QR Code dentro do quadrado
      </div>


      {error && (
        <div
          className="
            absolute
            bottom-20
            left-5
            right-5
            rounded-xl
            bg-destructive
            p-4
            text-center
            text-sm
            text-white
          "
        >
          {error}
        </div>
      )}

    </div>
  );
}