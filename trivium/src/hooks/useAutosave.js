import { useEffect, useRef, useState } from "react";

export function useAutosave(valor, onSave, delay = 900) {
  const timeoutRef = useRef(null);
  const primeiraRenderRef = useRef(true);
  const [status, setStatus] = useState("idle"); // idle, saving, saved, error, offline

  // Monitora a conexão com a internet
  useEffect(() => {
    function handleOnline() {
      setStatus("idle");
    }
    function handleOffline() {
      setStatus("offline");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) setStatus("offline");

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Dispara o salvamento automático
  useEffect(() => {
    if (primeiraRenderRef.current) {
      primeiraRenderRef.current = false;
      return;
    }

    // Bloqueia a tentativa de salvar se estiver sem internet
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }

    setStatus("idle");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        setStatus("saving");
        await onSave(valor);
        setStatus("saved");
      } catch (err) {
        console.error("[Trivium] Erro ao salvar automaticamente:", err);
        setStatus("error");
      }
    }, delay);

    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, delay]);

  return status;
}
