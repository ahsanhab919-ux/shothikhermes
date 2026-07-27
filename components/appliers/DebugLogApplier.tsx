'use client';

import { useEffect } from 'react';
import { debugLog } from '@/lib/debug-log';

export default function DebugLogApplier() {
  useEffect(() => {
    debugLog.installFetchInterceptor();
    debugLog.installGlobalErrorHandlers();
    debugLog.info('system', 'Debug logging initialized');

    return () => {
      debugLog.removeGlobalErrorHandlers();
    };
  }, []);

  return null;
}
