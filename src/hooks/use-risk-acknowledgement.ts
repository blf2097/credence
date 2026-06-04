'use client';

import { useCallback, useEffect, useState } from 'react';

export const RISK_ACK_KEY = 'credence:risk-ack:v1';
export const RISK_ACK_EVENT = 'credence:risk-ack-changed';

export function useRiskAcknowledgement() {
  const [acknowledged, setAcknowledgedState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setAcknowledgedState(window.localStorage.getItem(RISK_ACK_KEY) === 'true');
      setReady(true);
    };

    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(RISK_ACK_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(RISK_ACK_EVENT, sync);
    };
  }, []);

  const acknowledge = useCallback(() => {
    window.localStorage.setItem(RISK_ACK_KEY, 'true');
    window.dispatchEvent(new Event(RISK_ACK_EVENT));
  }, []);

  const reset = useCallback(() => {
    window.localStorage.removeItem(RISK_ACK_KEY);
    window.dispatchEvent(new Event(RISK_ACK_EVENT));
  }, []);

  return { acknowledged, ready, acknowledge, reset };
}
