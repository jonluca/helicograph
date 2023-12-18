import { useEffect, useState } from "react";

export const useIsMounted = () => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return isMounted;
};

export const useIsPWA = () => {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const checkPWA = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any)?.standalone ||
      document.referrer.includes("android-app://");

    setIsPWA(checkPWA());
  }, []);

  return isPWA;
};
