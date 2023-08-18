import { useEffect } from "react";
import type { MessageFromWebPanel } from "../../../src/panels/messageType";

export const useReceiveMessage = (callback: (data: MessageFromWebPanel) => void) => {
  useEffect(() => {
    const messageHandler = (event: { data: MessageFromWebPanel }) => {
      callback(event.data);
    };
    window.addEventListener("message", messageHandler);
    return () => window.removeEventListener("message", messageHandler);
  }, [callback]);
};
