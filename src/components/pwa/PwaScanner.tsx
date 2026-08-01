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
  const [carregando, setCarregando] = useState(true);


  useEffect(() => {
    iniciarScanner();


    return () => {
      pararScanner();
    };

  }, []);



  const iniciarScanner = async () => {

    try {

      setErro("");
      setCarregando(true);


      const cameras =
        await Html5Qrcode.getCameras();


      if (!cameras.length) {
        throw new Error(
          "Nenhuma câmera encontrada"
        );
      }



      // aguarda o DOM calcular tamanho
      await new Promise(resolve =>
        setTimeout(resolve, 500)
      );



      const scanner =
        new Html5Qrcode(
          "qr-reader"
        );


      scannerRef.current = scanner;



      await scanner.start(

        {
          facingMode: "environment",
        },


        {
          fps: 10,

          qrbox: {
            width: 250,
            height: 250,
          },

          disableFlip: false,
        },


        async (decodedText) => {



          await pararScanner();


          onScan(decodedText);

        },


        () => {
          // ignora erros normais de leitura
        }

      );





      setCarregando(false);



    } catch(error:any) {


      console.error(
        "ERRO SCANNER:",
        error
      );


      setCarregando(false);


      setErro(
        "Não foi possível acessar a câmera. Verifique a permissão."
      );

    }

  };




  const pararScanner = async () => {


    if (!scannerRef.current) {
      return;
    }



    try {


      const state =
        scannerRef.current.getState();


      if (state === 2) {

        await scannerRef.current.stop();

      }



      await scannerRef.current.clear();



    } catch(error) {

      console.log(
        "Erro ao parar:",
        error
      );

    }



    scannerRef.current = null;

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
        z-[9999]
        bg-black/90
        flex
        flex-col
      "
      style={{
        width:"100vw",
        height:"100dvh",
      }}
    >


      <div
        className="
          flex
          items-center
          justify-between
          px-5
          py-4
          text-white
          shrink-0
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
          "
        >
          ×
        </button>


      </div>




      <div
        className="
          flex-1
          flex
          items-center
          justify-center
          px-5
          overflow-hidden
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
          style={{
            minHeight:"300px"
          }}
        >



          {carregando && (

            <div
              className="
                h-80
                flex
                items-center
                justify-center
                text-white
                text-sm
              "
            >
              Abrindo câmera...
            </div>

          )}




          <div
            id="qr-reader"
            className="w-full"
          />




          {!carregando && (

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

          )}


        </div>


      </div>




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
            shrink-0
          "
        >
          {erro}

        </div>

      )}





      <div
        className="
          px-5
          pb-8
          text-center
          text-sm
          text-white/70
          shrink-0
        "
      >
        Posicione o QR Code dentro da área de leitura
      </div>



    </div>

  );

}