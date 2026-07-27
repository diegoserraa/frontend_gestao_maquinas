import { useEffect, useRef, useState } from "react";
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

  const [erro, setErro] = useState("");

  useEffect(() => {
    iniciarScanner();

    return () => {
      pararScanner();
    };
  }, []);


  const iniciarScanner = async () => {
    try {
      setErro("");

      scannerRef.current = new Html5Qrcode(
        "qr-reader"
      );


      await scannerRef.current.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,

          qrbox: {
            width: 260,
            height: 260,
          },

          aspectRatio: 1,
        },

        async (decodedText) => {
          await pararScanner();

          onScan(decodedText);
        },

        () => {}
      );


    } catch (error) {
      console.error(error);

      setErro(
        "Não foi possível acessar a câmera. Verifique a permissão."
      );
    }
  };


  const pararScanner = async () => {
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
    await pararScanner();

    onClose();
  };


  return (
    <div
      className="
        fixed
        inset-0
        z-50
        bg-black/90
        flex
        flex-col
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
            Escanear máquina
          </h2>

          <p className="text-sm text-white/70">
            Aponte para o QR Code
          </p>
        </div>


        <button
          onClick={fechar}
          className="
            h-10
            w-10
            rounded-full
            bg-white/10
            text-xl
            hover:bg-white/20
          "
        >
          ×
        </button>

      </div>


      {/* CAMERA */}
      <div
        className="
          flex-1
          flex
          items-center
          justify-center
          px-5
        "
      >

        <div
          className="
            relative
            w-full
            max-w-md
            rounded-3xl
            overflow-hidden
          "
        >

          <div
            id="qr-reader"
            className="w-full"
          />


          {/* MOLDURA */}
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
                rounded-3xl
                border-4
                border-white
                shadow-lg
              "
            />

          </div>

        </div>

      </div>


      {/* ERRO */}
      {erro && (
        <div
          className="
            mx-5
            mb-4
            rounded-xl
            bg-red-500/20
            p-4
            text-center
            text-sm
            text-white
          "
        >
          {erro}
        </div>
      )}


      {/* FOOTER */}
      <div
        className="
          px-5
          pb-8
          text-center
          text-sm
          text-white/70
        "
      >

        <p>
          Posicione o QR Code dentro da área de leitura
        </p>

      </div>

    </div>
  );
}